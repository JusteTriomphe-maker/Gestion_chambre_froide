<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\Client;
use App\Http\Middleware\RoleMiddleware;
use Barryvdh\DomPDF\PDF as DomPdfWrapper;
use App\Support\NotifyDG;
use App\Support\StockUnit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
    /**
     * Get products available for sale (accessible to cashiers).
     * Returns only what is needed to process a sale: name, prices, stock.
     */
    public function availableProducts(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!RoleMiddleware::can($user, 'sales', 'view')) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $products = Product::select([
                'id', 'name', 'category', 'barcode',
                'price_selling', 'price_per_carton',
                'stock_mode', 'kg_per_carton', 'unit', 'current_stock',
            ])
            ->where('current_stock', '>', 0)
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $products]);
    }

    /**
     * Get all sales with daily totals
     * Only includes PAID sales for revenue calculation
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!RoleMiddleware::can($user, 'sales', 'view')) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $query = Sale::with(['user', 'client', 'items.product']);

        // Filter by date range
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('sale_date', [$request->start_date, $request->end_date]);
        } elseif ($request->has('date')) {
            $query->whereDate('sale_date', $request->date);
        }

        // Filter by user (for caissier)
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Optional: filter by payment status
        if ($request->has('is_paid')) {
            $query->where('is_paid', $request->boolean('is_paid'));
        }

        $sales = $query->orderBy('sale_date', 'desc')->orderBy('id', 'desc')->get();

        // Calculate total from sale_items for PAID sales only
        $paidSalesTotal = $sales->where('is_paid', true)->sum(function ($sale) {
            return $sale->items->sum(function ($item) {
                return (float) $item->subtotal;
            });
        });

        return response()->json([
            'data' => $sales,
            'daily_total' => $paidSalesTotal,
        ]);
    }

    /**
     * Get daily sales summary
     * Only includes PAID sales for revenue calculation
     */
    public function dailySummary(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!RoleMiddleware::can($user, 'sales', 'view')) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $date = $request->has('date') ? $request->date : now()->format('Y-m-d');

        $dailySales = Sale::whereDate('sale_date', $date)
            ->with(['user', 'items.product'])
            ->orderBy('created_at', 'desc')
            ->get();

        $sumSaleItems = function ($sale) {
            return $sale->items->sum(function ($item) {
                return (float) $item->subtotal;
            });
        };

        $totalAmount = $dailySales->sum($sumSaleItems);

        $paidAmount = $dailySales->where('is_paid', true)->sum($sumSaleItems);

        $transactionCount = $dailySales->count();

        // Sales by product (toutes ventes du jour)
        $salesByProduct = SaleItem::whereHas('sale', function ($query) use ($date) {
            $query->whereDate('sale_date', $date);
        })
        ->with('product')
        ->get()
        ->groupBy('product_id')
        ->map(function ($items, $productId) {
            $firstItem = $items->first();
            return [
                'product_id' => $productId,
                'product_name' => $firstItem->product->name ?? 'Produit supprimé',
                'total_quantity' => $items->sum('quantity'),
                'total_amount' => $items->sum('subtotal'),
            ];
        })
        ->values();

        return response()->json([
            'date' => $date,
            'total_amount' => $totalAmount,
            'paid_amount' => $paidAmount,
            'transaction_count' => $transactionCount,
            'sales' => $dailySales,
            'sales_by_product' => $salesByProduct,
        ]);
    }

    /**
     * Create a new sale with multi-products support
     * This is the main entry point for creating sales
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!RoleMiddleware::can($user, 'sales', 'create')) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        // Support both old format (items array) and new format (from stock-exits)
        $validated = $request->validate([
            'client_id' => 'nullable|exists:clients,id',
            'client_name' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.input_unit' => 'nullable|in:kg,carton',
            'items.*.input_quantity' => 'nullable|numeric|min:0.01',
            'items.*.quantity' => 'required|numeric|min:0.01', // compat (kg)
            'items.*.unit_price' => 'nullable|numeric|min:0',
            'sale_date' => 'nullable|date',
            'is_paid' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $totalAmount = 0;
            
            // Verify stock availability for all items
            foreach ($validated['items'] as $item) {
                $product = Product::find($item['product_id']);
                $inputUnit = $item['input_unit'] ?? 'kg';
                $inputQty = isset($item['input_quantity']) ? (float) $item['input_quantity'] : (float) $item['quantity'];

                try {
                    $converted = StockUnit::toKg($product, $inputUnit, $inputQty);
                } catch (\InvalidArgumentException $e) {
                    DB::rollBack();
                    return response()->json(['message' => $e->getMessage()], 422);
                }

                $quantityKg = $converted['kg'];

                if ($product->current_stock < $quantityKg) {
                    DB::rollBack();
                    return response()->json([
                        'message' => "Stock insuffisant pour le produit: {$product->name}",
                        'available' => $product->current_stock,
                        'requested' => $quantityKg,
                    ], 422);
                }

                $unitPrice = StockUnit::resolveUnitPrice(
                    $product,
                    $inputUnit,
                    isset($item['unit_price']) ? (float) $item['unit_price'] : null
                );
                $totalAmount += $inputQty * $unitPrice;
            }

            // Handle client - create new if client_name provided
            $clientId = $validated['client_id'] ?? null;
            if (!empty($validated['client_name']) && trim($validated['client_name'])) {
                $client = Client::create([
                    'name' => trim($validated['client_name']),
                    'contact_info' => '',
                    'address' => '',
                    'phone' => '',
                    'email' => '',
                    'total_debt' => 0,
                ]);
                $clientId = $client->id;
            }

            // Determine payment status
            $isPaid = $validated['is_paid'] ?? false;

            // Create sale with payment status
            $sale = Sale::create([
                'sale_date' => $validated['sale_date'] ?? now()->toDateString(),
                'total_amount' => $totalAmount,
                'user_id' => $user->id,
                'client_id' => $clientId,
                'receipt_number' => Sale::generateReceiptNumber(),
                'notes' => $validated['notes'] ?? null,
                'is_paid' => $isPaid,
                'paid_at' => $isPaid ? now() : null,
            ]);

            // Create sale items and update stock
            foreach ($validated['items'] as $item) {
                $product = Product::find($item['product_id']);
                $inputUnit = $item['input_unit'] ?? 'kg';
                $inputQty = isset($item['input_quantity']) ? (float) $item['input_quantity'] : (float) $item['quantity'];
                $converted = StockUnit::toKg($product, $inputUnit, $inputQty);
                $quantityKg = $converted['kg'];

                $unitPrice = StockUnit::resolveUnitPrice(
                    $product,
                    $inputUnit,
                    isset($item['unit_price']) ? (float) $item['unit_price'] : null
                );
                $subtotal = $inputQty * $unitPrice;

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $item['product_id'],
                    'input_unit' => $inputUnit,
                    'input_quantity' => $inputQty,
                    'conversion_rate' => $converted['conversion_rate'],
                    'quantity' => $quantityKg,
                    'unit_price' => (float) $unitPrice,
                    'subtotal' => $subtotal,
                ]);

                // Update stock
                $product->current_stock -= $quantityKg;
                $product->save();
            }

            // Update client debt if not paid and client exists
            if (!$isPaid && $clientId) {
                $client = Client::find($clientId);
                if ($client) {
                    $client->total_debt += $totalAmount;
                    $client->save();
                }
            }

            DB::commit();

            $sale->load(['user', 'client', 'items.product']);

            NotifyDG::send('Nouvelle vente enregistrée', [
                "Reçu : {$sale->receipt_number}",
                "Date : {$sale->sale_date?->format('Y-m-d')}",
                "Client : " . ($sale->client?->name ?? '-'),
                "Montant : " . number_format((float) $totalAmount, 0, ',', ' ') . " FCFA",
                "Payée : " . ($isPaid ? 'Oui' : 'Non'),
                "Caissier : {$user->name} ({$user->role})",
            ]);

            return response()->json([
                'data' => $sale,
                'receipt_number' => $sale->receipt_number,
                'total_amount' => $totalAmount,
                'is_paid' => $isPaid,
                'message' => 'Vente enregistrée avec succès'
            ], 201);

        } catch (\InvalidArgumentException $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get single sale
     */
    public function show(Request $request, Sale $sale): JsonResponse
    {
        $user = $request->user();
        
        if (!RoleMiddleware::can($user, 'sales', 'view')) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $sale->load(['user', 'client', 'items.product']);

        return response()->json(['data' => $sale]);
    }

    /**
     * Delete sale (only DG)
     */
    public function destroy(Request $request, Sale $sale): JsonResponse
    {
        $user = $request->user();
        
        if (!RoleMiddleware::canDelete($user, 'sales')) {
            return response()->json(['message' => 'Accès refusé. Seul le DG peut supprimer une vente.'], 403);
        }

        DB::beginTransaction();
        try {
            // Restore stock
            foreach ($sale->items as $item) {
                $product = $item->product;
                $product->current_stock += $item->quantity;
                $product->save();
            }

            // Reverse client debt if not paid
            if ($sale->client && $sale->total_amount > 0) {
                $client = $sale->client;
                $client->total_debt = max(0, $client->total_debt - $sale->total_amount);
                $client->save();
            }

            // Delete sale items first
            $sale->items()->delete();
            
            // Delete sale
            $sale->delete();

            DB::commit();

            return response()->json(['message' => 'Vente supprimée avec succès']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get sales report by date range
     * Only includes PAID sales for revenue calculation
     */
    public function report(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!RoleMiddleware::can($user, 'sales', 'view')) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $startDate = $request->get('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', now()->toDateString());

        // Only get PAID sales
        $sales = Sale::where('is_paid', true)
            ->whereBetween('sale_date', [$startDate, $endDate])
            ->with(['user', 'items.product'])
            ->get();

        // Calculate total from sale_items (quantity * unit_price)
        $totalAmount = $sales->sum(function ($sale) {
            return $sale->items->sum(function ($item) {
                return (float) $item->subtotal;
            });
        });

        $transactionCount = $sales->count();

        // Daily breakdown
        $dailySales = $sales->groupBy(function ($sale) {
            return $sale->sale_date->format('Y-m-d');
        })->map(function ($daySales) {
            return [
                'date' => $daySales->first()->sale_date->format('Y-m-d'),
                'total_amount' => $daySales->sum(function ($sale) {
                    return $sale->items->sum(function ($item) {
                        return (float) $item->subtotal;
                    });
                }),
                'transaction_count' => $daySales->count(),
            ];
        })->values();

        // Top products (only from PAID sales)
        $topProducts = SaleItem::whereHas('sale', function ($query) use ($startDate, $endDate) {
            $query->whereBetween('sale_date', [$startDate, $endDate])->where('is_paid', true);
        })
        ->with('product')
        ->get()
        ->groupBy('product_id')
        ->map(function ($items, $productId) {
            $firstItem = $items->first();
            return [
                'product_id' => $productId,
                'product_name' => $firstItem->product->name ?? 'Produit supprimé',
                'total_quantity' => $items->sum('quantity'),
                'total_amount' => $items->sum('subtotal'),
            ];
        })
        ->sortByDesc('total_amount')
        ->take(10)
        ->values();

        return response()->json([
            'start_date' => $startDate,
            'end_date' => $endDate,
            'total_amount' => $totalAmount,
            'transaction_count' => $transactionCount,
            'daily_sales' => $dailySales,
            'top_products' => $topProducts,
        ]);
    }

    /**
     * Generate daily PDF report of daily sales (DG / Gérant uniquement).
     */
    public function generateDailyReport(Request $request)
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['dg', 'gerant'], true)) {
            abort(403, 'Accès refusé');
        }

        $date = $request->get('date', now()->toDateString());

        // Par défaut : toutes les ventes du jour (payées + non payées)
        // Option : ?paid_only=1 pour n'inclure que les ventes payées
        $salesQuery = Sale::whereDate('sale_date', $date);
        if ($request->boolean('paid_only')) {
            $salesQuery->where('is_paid', true);
        }

        $sales = $salesQuery
            ->with(['user', 'client', 'items.product'])
            ->orderBy('created_at', 'desc')
            ->get();

        $totalAmount = $sales->sum(function ($sale) {
            return $sale->items->sum(function ($item) {
                return (float) $item->subtotal;
            });
        });

        /** @var DomPdfWrapper $pdf */
        $pdf = app('dompdf.wrapper');
        $pdf->loadView('reports.daily_sales', [
            'date' => $date,
            'sales' => $sales,
            'totalAmount' => $totalAmount,
        ])->setPaper('a4', 'portrait');

        $fileName = 'ventes_' . str_replace('-', '_', $date) . '.pdf';

        return $pdf->download($fileName);
    }
}
