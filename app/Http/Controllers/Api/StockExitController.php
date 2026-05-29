<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockExit;
use App\Models\Product;
use App\Models\Client;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Http\Middleware\RoleMiddleware;
use App\Support\NotifyDG;
use App\Support\StockUnit;

class StockExitController extends Controller
{
    /**
     * Display a listing of the stock exits.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Check view permission
        if (!RoleMiddleware::can($user, 'stock-exits', 'view')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir les sorties de stock.'], 403);
        }

        $query = StockExit::with(['product', 'client', 'user']);

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->whereHas('product', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        if ($request->has('product_id') && $request->product_id) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->has('client_id') && $request->client_id) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->has('reason') && $request->reason) {
            $query->where('reason', $request->reason);
        }

        if ($request->has('is_paid')) {
            $query->where('is_paid', $request->boolean('is_paid'));
        }

        // Filter by today's date
        if ($request->has('today') && $request->boolean('today')) {
            $query->whereDate('exit_date', today());
        }

        $sortField = $request->get('sort_by', 'id');
        $sortDirection = $request->get('sort_dir', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $perPage = $request->get('per_page', 15);
        $stockExits = $query->paginate($perPage);

        return response()->json($stockExits);
    }

    /**
     * Store a newly created stock exit (single product - backward compatible).
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Check create permission
        if (!RoleMiddleware::can($user, 'stock-exits', 'create')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de créer des sorties de stock.'], 403);
        }

        // Check if it's a multi-product sale
        if ($request->has('items') && is_array($request->items) && count($request->items) > 0) {
            return $this->storeMultiProductSale($request, $user);
        }

        // Single product sale (backward compatible)
        return $this->storeSingleProductSale($request, $user);
    }

    /**
     * Store a multi-product sale.
     */
    private function storeMultiProductSale(Request $request, $user): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.input_unit' => 'nullable|in:kg,carton',
            'items.*.input_quantity' => 'nullable|numeric|min:0.01',
            'items.*.quantity' => 'required|numeric|min:0.01', // compat (kg)
            'items.*.unit_price' => 'required|numeric|min:0',
            'exit_date' => 'required|date',
            'client_id' => 'nullable|exists:clients,id',
            'client_name' => 'nullable|string',
            'reason' => 'required|in:vente,perte,peremption,autre',
            'is_paid' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        try {
            return DB::transaction(function () use ($validated, $user, $request) {
                // Handle client
                $clientId = null;
                if (!empty($validated['client_name']) && trim($validated['client_name'])) {
                    // Create new client
                    $client = Client::create([
                        'name' => trim($validated['client_name']),
                        'contact_info' => '',
                        'address' => '',
                        'phone' => '',
                        'email' => '',
                        'total_debt' => 0,
                    ]);
                    $clientId = $client->id;
                } elseif (!empty($validated['client_id'])) {
                    $clientId = $validated['client_id'];
                }

                // Generate receipt number
                $receiptNumber = Sale::generateReceiptNumber();

                // Calculate total amount
                $totalAmount = 0;
                foreach ($validated['items'] as $item) {
                    $lineQty = (float) ($item['input_quantity'] ?? $item['quantity']);
                    $totalAmount += $lineQty * (float) $item['unit_price'];
                }

                // Determine payment status
                $isPaid = $validated['is_paid'] ?? false;

                // Create sale record
                $sale = Sale::create([
                    'sale_date' => $validated['exit_date'],
                    'total_amount' => $totalAmount,
                    'user_id' => $user->id,
                    'client_id' => $clientId,
                    'receipt_number' => $receiptNumber,
                    'notes' => $validated['notes'] ?? '',
                ]);

                // Process each item
                $saleItems = [];
                foreach ($validated['items'] as $itemData) {
                    $product = Product::find($itemData['product_id']);

                    $inputUnit = $itemData['input_unit'] ?? 'kg';
                    $inputQty = isset($itemData['input_quantity']) ? (float) $itemData['input_quantity'] : (float) $itemData['quantity'];

                    try {
                        $converted = StockUnit::toKg($product, $inputUnit, $inputQty);
                    } catch (\InvalidArgumentException $e) {
                        throw new \Exception($e->getMessage());
                    }

                    $quantityKg = $converted['kg'];
                    
                    // Check stock availability
                    if ($product->current_stock < $quantityKg) {
                        throw new \Exception("Stock insuffisant pour le produit: {$product->name}. Stock disponible: {$product->current_stock} kg");
                    }

                    $subtotal = $inputQty * (float) $itemData['unit_price'];

                    // Create sale item
                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => $itemData['product_id'],
                        'input_unit' => $inputUnit,
                        'input_quantity' => $inputQty,
                        'conversion_rate' => $converted['conversion_rate'],
                        'quantity' => $quantityKg, // stock truth (kg)
                        'unit_price' => $itemData['unit_price'],
                        'subtotal' => $subtotal,
                    ]);

                    // Reduce product stock
                    $product->current_stock -= $quantityKg;
                    $product->save();

                    $saleItems[] = [
                        'product' => $product->name,
                        'quantity' => $inputQty,
                        'unit' => $inputUnit,
                        'quantity_kg' => $quantityKg,
                        'unit_price' => $itemData['unit_price'],
                        'subtotal' => $subtotal,
                    ];
                }

                // Update client debt if not paid and client exists
                if (!$isPaid && $clientId) {
                    $client = Client::find($clientId);
                    if ($client) {
                        $client->total_debt += $totalAmount;
                        $client->save();
                    }
                }

                // Load relationships for response
                $sale->load(['client', 'user', 'items.product']);

                NotifyDG::send('Sortie de stock / Vente (multi-produits)', [
                    "Reçu : {$receiptNumber}",
                    "Client : " . ($sale->client?->name ?? '-'),
                    "Date : {$validated['exit_date']}",
                    "Montant : " . number_format((float) $totalAmount, 0, ',', ' ') . " FCFA",
                    "Payée : " . ($isPaid ? 'Oui' : 'Non'),
                    "Caissier : {$user->name} ({$user->role})",
                ]);

                return response()->json([
                    'message' => 'Vente créée avec succès',
                    'sale' => $sale,
                    'receipt_number' => $receiptNumber,
                    'total_amount' => $totalAmount,
                    'items' => $saleItems,
                    'is_paid' => $isPaid,
                ], 201);
            });
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création de la vente',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Store a single product sale (backward compatible).
     */
    private function storeSingleProductSale(Request $request, $user): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'client_id' => 'nullable|exists:clients,id',
            'client_name' => 'nullable|string',
            'input_unit' => 'nullable|in:kg,carton',
            'input_quantity' => 'nullable|numeric|min:0.01',
            'quantity' => 'required|numeric|min:0.01', // compat (kg)
            'exit_date' => 'required|date',
            'reason' => 'required|in:vente,perte,peremption,autre',
            'unit_price' => 'required|numeric|min:0',
            'is_paid' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        // Handle client
        $clientId = null;
        if (!empty($validated['client_name']) && trim($validated['client_name'])) {
            // Create new client
            $client = Client::create([
                'name' => trim($validated['client_name']),
                'contact_info' => '',
                'address' => '',
                'phone' => '',
                'email' => '',
                'total_debt' => 0,
            ]);
            $clientId = $client->id;
        } elseif (!empty($validated['client_id'])) {
            $clientId = $validated['client_id'];
        }

        $product = Product::find($validated['product_id']);
        $inputUnit = $validated['input_unit'] ?? 'kg';
        $inputQty = isset($validated['input_quantity']) ? (float) $validated['input_quantity'] : (float) $validated['quantity'];

        try {
            $converted = StockUnit::toKg($product, $inputUnit, $inputQty);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $quantityKg = $converted['kg'];

        // Add user_id (caissier) to the validated data
        $validated['user_id'] = $user->id;
        $validated['client_id'] = $clientId;
        $validated['input_unit'] = $inputUnit;
        $validated['input_quantity'] = $inputQty;
        $validated['conversion_rate'] = $converted['conversion_rate'];
        $validated['quantity'] = $quantityKg; // stock truth (kg)

        // Check if enough stock available
        if ($product->current_stock < $quantityKg) {
            return response()->json([
                'message' => 'Stock insuffisant disponible',
                'available_stock' => $product->current_stock,
                'requested_quantity' => $quantityKg
            ], 422);
        }

        // Generate receipt number for single sale
        $receiptNumber = Sale::generateReceiptNumber();

        $stockExit = StockExit::create($validated);

        // Reduce product current stock (kg)
        $product->current_stock -= $quantityKg;
        $product->save();

        // Also create Sale and SaleItem for tracking
        $totalCost = $inputQty * (float) $validated['unit_price'];
        
        $sale = Sale::create([
            'sale_date' => $validated['exit_date'],
            'total_amount' => $totalCost,
            'user_id' => $user->id,
            'client_id' => $clientId,
            'receipt_number' => $receiptNumber,
            'notes' => $validated['notes'] ?? '',
        ]);

        SaleItem::create([
            'sale_id' => $sale->id,
            'product_id' => $validated['product_id'],
            'input_unit' => $inputUnit,
            'input_quantity' => $inputQty,
            'conversion_rate' => $converted['conversion_rate'],
            'quantity' => $quantityKg,
            'unit_price' => $validated['unit_price'],
            'subtotal' => $totalCost,
        ]);

        // Update client total debt if not paid and client exists
        if (!$validated['is_paid'] && $clientId) {
            $client = Client::find($clientId);
            if ($client) {
                $client->total_debt += $totalCost;
                $client->save();
            }
        }

        $stockExit->load(['product', 'client', 'user']);

        NotifyDG::send('Sortie de stock / Vente', [
            "Reçu : {$receiptNumber}",
            "Produit : {$stockExit->product?->name}",
            "Client : " . ($stockExit->client?->name ?? '-'),
            "Quantité : {$stockExit->quantity}",
            "Prix unitaire : " . number_format((float) $stockExit->unit_price, 0, ',', ' ') . " FCFA",
            "Date : {$stockExit->exit_date}",
            "Payée : " . ($stockExit->is_paid ? 'Oui' : 'Non'),
            "Caissier : {$user->name} ({$user->role})",
        ]);

        return response()->json([
            'message' => 'Stock exit created successfully',
            'stock_exit' => $stockExit,
            'receipt_number' => $receiptNumber,
            'sale_id' => $sale->id,
        ], 201);
    }

    /**
     * Display the specified stock exit.
     */
    public function show(Request $request, StockExit $stockExit): JsonResponse
    {
        $user = $request->user();
        
        // Check view permission
        if (!RoleMiddleware::can($user, 'stock-exits', 'view')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir les sorties de stock.'], 403);
        }

        $stockExit->load(['product', 'client']);
        return response()->json($stockExit);
    }

    /**
     * Update the specified stock exit.
     */
    public function update(Request $request, StockExit $stockExit): JsonResponse
    {
        $user = $request->user();
        
        // Check edit permission
        if (!RoleMiddleware::can($user, 'stock-exits', 'edit')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de modifier des sorties de stock.'], 403);
        }

        $validated = $request->validate([
            'product_id' => 'sometimes|exists:products,id',
            'client_id' => 'sometimes|exists:clients,id',
            'quantity' => 'sometimes|numeric|min:0.01',
            'exit_date' => 'sometimes|date',
            'reason' => 'sometimes|in:vente,perte,peremption,autre',
            'unit_price' => 'sometimes|numeric|min:0',
            'is_paid' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $oldQuantity = $stockExit->quantity;
        $oldIsPaid = $stockExit->is_paid;
        $oldClientId = $stockExit->client_id;

        // Check stock availability if quantity is being increased
        if (isset($validated['quantity']) && $validated['quantity'] > $oldQuantity) {
            $product = isset($validated['product_id']) 
                ? Product::find($validated['product_id']) 
                : $stockExit->product;
            
            $availableStock = $product->current_stock + $oldQuantity;
            if ($availableStock < $validated['quantity']) {
                return response()->json([
                    'message' => 'Insufficient stock available',
                    'available_stock' => $availableStock,
                    'requested_quantity' => $validated['quantity']
                ], 422);
            }
        }

        $stockExit->update($validated);

        // Update product current stock if quantity changed
        if (isset($validated['quantity']) && $validated['quantity'] != $oldQuantity) {
            $product = $stockExit->product;
            $product->current_stock = $product->current_stock + $oldQuantity - $validated['quantity'];
            $product->save();
        }

        // Update client debt if payment status changed
        if (isset($validated['is_paid']) && $validated['is_paid'] != $oldIsPaid) {
            $totalCost = $stockExit->quantity * $stockExit->unit_price;
            
            if ($validated['is_paid'] && !$oldIsPaid) {
                // Marking as paid - reduce client debt
                $client = Client::find($oldClientId);
                if ($client) {
                    $client->total_debt = max(0, $client->total_debt - $totalCost);
                    $client->save();
                }
            } elseif (!$validated['is_paid'] && $oldIsPaid) {
                // Marking as unpaid - increase client debt
                $client = Client::find($oldClientId);
                if ($client) {
                    $client->total_debt += $totalCost;
                    $client->save();
                }
            }
        }

        $stockExit->load(['product', 'client']);

        return response()->json([
            'message' => 'Stock exit updated successfully',
            'stock_exit' => $stockExit
        ]);
    }

    /**
     * Remove the specified stock exit.
     */
    public function destroy(Request $request, StockExit $stockExit): JsonResponse
    {
        $user = $request->user();
        
        // Check delete permission
        if (!RoleMiddleware::can($user, 'stock-exits', 'delete')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de supprimer des sorties de stock.'], 403);
        }

        // Restore the stock quantity to product
        $product = $stockExit->product;
        $product->current_stock += $stockExit->quantity;
        $product->save();

        // Reverse client debt if not paid
        if (!$stockExit->is_paid && $stockExit->client) {
            $client = $stockExit->client;
            $totalCost = $stockExit->quantity * $stockExit->unit_price;
            $client->total_debt = max(0, $client->total_debt - $totalCost);
            $client->save();
        }

        $stockExit->delete();

        return response()->json([
            'message' => 'Stock exit deleted successfully'
        ]);
    }

    /**
     * Get pending stock exits (unpaid).
     */
    public function pending(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Check view permission
        if (!RoleMiddleware::can($user, 'stock-exits', 'view')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir les sorties de stock.'], 403);
        }

        $pendingExits = StockExit::with(['product', 'client'])
            ->where('is_paid', false)
            ->orderBy('exit_date', 'desc')
            ->get();

        $totalPending = $pendingExits->sum(function ($exit) {
            return $exit->quantity * $exit->unit_price;
        });

        return response()->json([
            'exits' => $pendingExits,
            'total_pending' => $totalPending,
            'count' => $pendingExits->count()
        ]);
    }
}
