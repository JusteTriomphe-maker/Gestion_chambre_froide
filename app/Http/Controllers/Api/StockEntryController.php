<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockEntry;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Http\Middleware\RoleMiddleware;
use App\Support\NotifyDG;
use App\Support\StockUnit;

class StockEntryController extends Controller
{
    /**
     * Display a listing of the stock entries.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Check view permission
        if (!RoleMiddleware::can($user, 'stock-entries', 'view')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir les entrées de stock.'], 403);
        }

        $query = StockEntry::with(['product', 'supplier']);

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->whereHas('product', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        if ($request->has('product_id') && $request->product_id) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->has('supplier_id') && $request->supplier_id) {
            $query->where('supplier_id', $request->supplier_id);
        }

        if ($request->has('is_paid')) {
            $query->where('is_paid', $request->boolean('is_paid'));
        }

        $sortField = $request->get('sort_by', 'id');
        $sortDirection = $request->get('sort_dir', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $perPage = $request->get('per_page', 15);
        $stockEntries = $query->paginate($perPage);

        return response()->json($stockEntries);
    }

    /**
     * Store a newly created stock entry.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Check create permission
        if (!RoleMiddleware::can($user, 'stock-entries', 'create')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de créer des entrées de stock.'], 403);
        }

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'supplier_id' => 'required|exists:suppliers,id',
            // quantité saisie + unité (compat : si input_* absent, on garde quantity comme kg)
            'input_unit' => 'nullable|in:kg,carton',
            'input_quantity' => 'nullable|numeric|min:0.01',
            'quantity' => 'required|numeric|min:0.01',
            'expiration_date' => 'required|date|after_or_equal:today',
            'entry_date' => 'required|date',
            'batch_number' => 'nullable|string|max:255',
            'unit_price' => 'required|numeric|min:0',
            'is_paid' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $product = Product::find($validated['product_id']);

        $inputUnit = $validated['input_unit'] ?? 'kg';
        $inputQty = isset($validated['input_quantity']) ? (float) $validated['input_quantity'] : (float) $validated['quantity'];

        try {
            $converted = StockUnit::toKg($product, $inputUnit, $inputQty);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $quantityKg = $converted['kg'];

        $stockEntry = StockEntry::create([
            'product_id' => $validated['product_id'],
            'supplier_id' => $validated['supplier_id'],
            'input_unit' => $inputUnit,
            'input_quantity' => $inputQty,
            'conversion_rate' => $converted['conversion_rate'],
            'quantity' => $quantityKg,
            'expiration_date' => $validated['expiration_date'],
            'entry_date' => $validated['entry_date'],
            'batch_number' => $validated['batch_number'] ?? null,
            'unit_price' => $validated['unit_price'],
            'is_paid' => $validated['is_paid'] ?? false,
            'notes' => $validated['notes'] ?? null,
        ]);

        // Update product current stock
        $product->current_stock += $quantityKg;
        $product->save();

        // Update supplier total debt if not paid
        if (!$validated['is_paid']) {
            $supplier = Supplier::find($validated['supplier_id']);
            $totalCost = $validated['quantity'] * $validated['unit_price'];
            $supplier->total_debt += $totalCost;
            $supplier->save();
        }

        $stockEntry->load(['product', 'supplier']);

        NotifyDG::send('Nouvelle entrée en stock', [
            "Produit : {$stockEntry->product?->name}",
            "Fournisseur : {$stockEntry->supplier?->name}",
            "Quantité : {$stockEntry->input_quantity} {$stockEntry->input_unit} (→ {$stockEntry->quantity} kg)",
            "Prix unitaire : " . number_format((float) $stockEntry->unit_price, 0, ',', ' ') . " FCFA",
            "Date : {$stockEntry->entry_date}",
            "Créée par : {$user->name} ({$user->role})",
        ]);

        return response()->json([
            'message' => 'Stock entry created successfully',
            'stock_entry' => $stockEntry
        ], 201);
    }

    /**
     * Display the specified stock entry.
     */
    public function show(Request $request, StockEntry $stockEntry): JsonResponse
    {
        $user = $request->user();
        
        // Check view permission
        if (!RoleMiddleware::can($user, 'stock-entries', 'view')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir les entrées de stock.'], 403);
        }

        $stockEntry->load(['product', 'supplier']);
        return response()->json($stockEntry);
    }

    /**
     * Update the specified stock entry.
     */
    public function update(Request $request, StockEntry $stockEntry): JsonResponse
    {
        $user = $request->user();
        
        // Check edit permission
        if (!RoleMiddleware::can($user, 'stock-entries', 'edit')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de modifier des entrées de stock.'], 403);
        }

        $validated = $request->validate([
            'product_id' => 'sometimes|exists:products,id',
            'supplier_id' => 'sometimes|exists:suppliers,id',
            'quantity' => 'sometimes|numeric|min:0.01',
            'expiration_date' => 'sometimes|date',
            'entry_date' => 'sometimes|date',
            'batch_number' => 'nullable|string|max:255',
            'unit_price' => 'sometimes|numeric|min:0',
            'is_paid' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $oldQuantity = $stockEntry->quantity;
        $oldIsPaid = $stockEntry->is_paid;
        $oldSupplierId = $stockEntry->supplier_id;

        $stockEntry->update($validated);

        // Update product current stock if quantity changed
        if (isset($validated['quantity']) && $validated['quantity'] != $oldQuantity) {
            $product = $stockEntry->product;
            $product->current_stock = $product->current_stock - $oldQuantity + $validated['quantity'];
            $product->save();
        }

        // Update supplier debt if payment status changed
        if (isset($validated['is_paid']) && $validated['is_paid'] != $oldIsPaid) {
            $totalCost = $stockEntry->quantity * $stockEntry->unit_price;
            
            if ($validated['is_paid'] && !$oldIsPaid) {
                // Marking as paid - reduce supplier debt
                $supplier = Supplier::find($oldSupplierId);
                $supplier->total_debt = max(0, $supplier->total_debt - $totalCost);
                $supplier->save();
            } elseif (!$validated['is_paid'] && $oldIsPaid) {
                // Marking as unpaid - increase supplier debt
                $supplier = Supplier::find($oldSupplierId);
                $supplier->total_debt += $totalCost;
                $supplier->save();
            }
        }

        $stockEntry->load(['product', 'supplier']);

        return response()->json([
            'message' => 'Stock entry updated successfully',
            'stock_entry' => $stockEntry
        ]);
    }

    /**
     * Remove the specified stock entry.
     */
    public function destroy(Request $request, StockEntry $stockEntry): JsonResponse
    {
        $user = $request->user();
        
        // Check delete permission
        if (!RoleMiddleware::can($user, 'stock-entries', 'delete')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de supprimer des entrées de stock.'], 403);
        }

        // Reverse the stock quantity from product
        $product = $stockEntry->product;
        $product->current_stock = max(0, $product->current_stock - $stockEntry->quantity);
        $product->save();

        // Reverse supplier debt if not paid
        if (!$stockEntry->is_paid) {
            $supplier = $stockEntry->supplier;
            $totalCost = $stockEntry->quantity * $stockEntry->unit_price;
            $supplier->total_debt = max(0, $supplier->total_debt - $totalCost);
            $supplier->save();
        }

        $stockEntry->delete();

        return response()->json([
            'message' => 'Stock entry deleted successfully'
        ]);
    }

    /**
     * Get pending stock entries (unpaid).
     */
    public function pending(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Check view permission
        if (!RoleMiddleware::can($user, 'stock-entries', 'view')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir les entrées de stock.'], 403);
        }

        $pendingEntries = StockEntry::with(['product', 'supplier'])
            ->where('is_paid', false)
            ->orderBy('entry_date', 'desc')
            ->get();

        $totalPending = $pendingEntries->sum(function ($entry) {
            return $entry->quantity * $entry->unit_price;
        });

        return response()->json([
            'entries' => $pendingEntries,
            'total_pending' => $totalPending,
            'count' => $pendingEntries->count()
        ]);
    }
}
