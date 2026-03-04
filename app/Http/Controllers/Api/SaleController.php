<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\Client;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
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
                return $item->quantity * $item->unit_price;
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

        // Only get PAID sales
        $dailySales = Sale::where('is_paid', true)
            ->whereDate('sale_date', $date)
            ->with(['user', 'items.product'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Calculate total from sale_items (quantity * unit_price)
        $totalAmount = $dailySales->sum(function ($sale) {
            return $sale->items->sum(function ($item) {
                return $item->quantity * $item->unit_price;
            });
        });

        $transactionCount = $dailySales->count();

        // Sales by product (only from PAID sales)
        $salesByProduct = SaleItem::whereHas('sale', function ($query) use ($date) {
            $query->whereDate('sale_date', $date)->where('is_paid', true);
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
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
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
                if ($product->current_stock < $item['quantity']) {
                    DB::rollBack();
                    return response()->json([
                        'message' => "Stock insuffisant pour le produit: {$product->name}",
                        'available' => $product->current_stock,
                        'requested' => $item['quantity'],
                    ], 422);
                }
                $totalAmount += $item['quantity'] * $item['unit_price'];
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
                $subtotal = $item['quantity'] * $item['unit_price'];

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'subtotal' => $subtotal,
                ]);

                // Update stock
                $product->current_stock -= $item['quantity'];
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

            return response()->json([
                'data' => $sale,
                'receipt_number' => $sale->receipt_number,
                'total_amount' => $totalAmount,
                'is_paid' => $isPaid,
                'message' => 'Vente enregistrée avec succès'
            ], 201);

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
                return $item->quantity * $item->unit_price;
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
                        return $item->quantity * $item->unit_price;
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
}
