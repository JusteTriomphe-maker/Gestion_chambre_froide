<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Middleware\RoleMiddleware;

class ProductController extends Controller
{
    /**
     * Display a listing of the products.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Check view permission
        if (!RoleMiddleware::can($user, 'products', 'view')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir les produits.'], 403);
        }

        $query = Product::query();

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        // Filter by category
        if ($request->has('category') && $request->category) {
            $query->where('category', $request->category);
        }

        // Sort by field
        $sortField = $request->get('sort_by', 'id');
        $sortDirection = $request->get('sort_dir', 'desc');
        $query->orderBy($sortField, $sortDirection);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $products = $query->paginate($perPage);

        return response()->json($products);
    }

    /**
     * Store a newly created product.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Check create permission
        if (!RoleMiddleware::can($user, 'products', 'create')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de créer des produits.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'barcode' => 'nullable|string|unique:products,barcode',
            'category' => 'nullable|string|max:255',
            'price_buying' => 'required|numeric|min:0',
            'price_selling' => 'required|numeric|min:0',
            'price_per_carton' => 'nullable|numeric|min:0',
            'unit' => 'required|string|max:50',
            'stock_mode' => 'nullable|in:kg_only,carton_only,kg_and_carton',
            'kg_per_carton' => 'nullable|numeric|min:0.01',
            'min_threshold' => 'nullable|numeric|min:0',
            'current_stock' => 'nullable|numeric|min:0',
        ]);

        // Defaults/normalisation
        $validated['stock_mode'] = $validated['stock_mode'] ?? 'kg_only';
        if ($validated['stock_mode'] === 'kg_only') {
            $validated['kg_per_carton'] = null;
            $validated['price_per_carton'] = null;
        }

        $product = Product::create($validated);

        return response()->json([
            'message' => 'Product created successfully',
            'product' => $product
        ], 201);
    }

    /**
     * Display the specified product.
     */
    public function show(Request $request, Product $product): JsonResponse
    {
        $user = $request->user();
        
        // Check view permission
        if (!RoleMiddleware::can($user, 'products', 'view')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir les produits.'], 403);
        }

        $product->load(['stockEntries', 'stockExits']);
        return response()->json($product);
    }

    /**
     * Update the specified product.
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        $user = $request->user();
        
        // Check edit permission
        if (!RoleMiddleware::can($user, 'products', 'edit')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de modifier des produits.'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'barcode' => 'sometimes|string|unique:products,barcode,' . $product->id,
            'category' => 'nullable|string|max:255',
            'price_buying' => 'sometimes|numeric|min:0',
            'price_selling' => 'sometimes|numeric|min:0',
            'price_per_carton' => 'nullable|numeric|min:0',
            'unit' => 'sometimes|string|max:50',
            'stock_mode' => 'nullable|in:kg_only,carton_only,kg_and_carton',
            'kg_per_carton' => 'nullable|numeric|min:0.01',
            'min_threshold' => 'nullable|numeric|min:0',
            'current_stock' => 'nullable|numeric|min:0',
        ]);

        if (isset($validated['stock_mode']) && $validated['stock_mode'] === 'kg_only') {
            $validated['kg_per_carton'] = null;
            $validated['price_per_carton'] = null;
        }

        $product->update($validated);

        return response()->json([
            'message' => 'Product updated successfully',
            'product' => $product
        ]);
    }

    /**
     * Remove the specified product.
     */
    public function destroy(Request $request, Product $product): JsonResponse
    {
        $user = $request->user();
        
        // Check delete permission
        if (!RoleMiddleware::can($user, 'products', 'delete')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de supprimer des produits.'], 403);
        }

        // Check if product has related records
        if ($product->stockEntries()->count() > 0 || $product->stockExits()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete product with existing stock entries or exits'
            ], 422);
        }

        $product->delete();

        return response()->json([
            'message' => 'Product deleted successfully'
        ]);
    }

    /**
     * Get stock history for a product.
     */
    public function stockHistory(Request $request, Product $product): JsonResponse
    {
        $user = $request->user();
        
        // Check view permission
        if (!RoleMiddleware::can($user, 'products', 'view')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir les produits.'], 403);
        }

        $entries = $product->stockEntries()
            ->select('id', 'quantity', 'entry_date', 'unit_price', 'created_at')
            ->get()
            ->map(function ($entry) {
                return [
                    'type' => 'entry',
                    'quantity' => $entry->quantity,
                    'date' => $entry->entry_date,
                    'unit_price' => $entry->unit_price,
                    'total' => $entry->quantity * $entry->unit_price,
                    'created_at' => $entry->created_at,
                ];
            });

        $exits = $product->stockExits()
            ->select('id', 'quantity', 'exit_date', 'unit_price', 'reason', 'created_at')
            ->get()
            ->map(function ($exit) {
                return [
                    'type' => 'exit',
                    'quantity' => $exit->quantity,
                    'date' => $exit->exit_date,
                    'unit_price' => $exit->unit_price,
                    'total' => $exit->quantity * $exit->unit_price,
                    'reason' => $exit->reason,
                    'created_at' => $exit->created_at,
                ];
            });

        $history = $entries->concat($exits)->sortBy('date')->values();

        return response()->json($history);
    }

    /**
     * Get products with low stock.
     */
    public function lowStock(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Check view permission
        if (!RoleMiddleware::can($user, 'products', 'view')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir les produits.'], 403);
        }

        $products = Product::whereRaw('current_stock < min_threshold')
            ->orderByRaw('current_stock - min_threshold')
            ->get();

        return response()->json($products);
    }
}
