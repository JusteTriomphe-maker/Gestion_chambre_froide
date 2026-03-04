<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\Debt;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Http\Middleware\RoleMiddleware;

class SupplierController extends Controller
{
    /**
     * Display a listing of the suppliers.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Check view permission
        if (!RoleMiddleware::can($user, 'suppliers', 'view')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir les fournisseurs.'], 403);
        }

        $query = Supplier::query();

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Sort by field
        $sortField = $request->get('sort_by', 'id');
        $sortDirection = $request->get('sort_dir', 'desc');
        $query->orderBy($sortField, $sortDirection);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $suppliers = $query->paginate($perPage);

        return response()->json($suppliers);
    }

    /**
     * Store a newly created supplier.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Check create permission
        if (!RoleMiddleware::can($user, 'suppliers', 'create')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de créer des fournisseurs.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_info' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'total_debt' => 'nullable|numeric|min:0',
        ]);

        $supplier = Supplier::create($validated);

        return response()->json([
            'message' => 'Supplier created successfully',
            'supplier' => $supplier
        ], 201);
    }

    /**
     * Display the specified supplier.
     */
    public function show(Request $request, Supplier $supplier): JsonResponse
    {
        $user = $request->user();
        
        // Check view permission
        if (!RoleMiddleware::can($user, 'suppliers', 'view')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir les fournisseurs.'], 403);
        }

        $supplier->load(['stockEntries', 'debts']);
        return response()->json($supplier);
    }

    /**
     * Update the specified supplier.
     */
    public function update(Request $request, Supplier $supplier): JsonResponse
    {
        $user = $request->user();
        
        // Check edit permission
        if (!RoleMiddleware::can($user, 'suppliers', 'edit')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de modifier des fournisseurs.'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'contact_info' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'total_debt' => 'nullable|numeric|min:0',
        ]);

        $supplier->update($validated);

        return response()->json([
            'message' => 'Supplier updated successfully',
            'supplier' => $supplier
        ]);
    }

    /**
     * Remove the specified supplier.
     */
    public function destroy(Request $request, Supplier $supplier): JsonResponse
    {
        $user = $request->user();
        
        // Check delete permission
        if (!RoleMiddleware::can($user, 'suppliers', 'delete')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de supprimer des fournisseurs.'], 403);
        }

        // Check if supplier has related records
        if ($supplier->stockEntries()->count() > 0 || $supplier->debts()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete supplier with existing stock entries or debts'
            ], 422);
        }

        $supplier->delete();

        return response()->json([
            'message' => 'Supplier deleted successfully'
        ]);
    }

    /**
     * Get debts for a supplier.
     */
    public function debts(Request $request, Supplier $supplier): JsonResponse
    {
        $user = $request->user();
        
        // Check view permission
        if (!RoleMiddleware::can($user, 'suppliers', 'view')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir les fournisseurs.'], 403);
        }

        $debts = $supplier->debts()->orderBy('date', 'desc')->get();
        return response()->json($debts);
    }

    /**
     * Pay debt for a supplier.
     */
    public function payDebt(Request $request, Supplier $supplier): JsonResponse
    {
        $user = $request->user();
        
        // Check pay permission
        if (!RoleMiddleware::can($user, 'debts', 'pay')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de payer des dettes.'], 403);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        // Create a debit record (money paid to supplier reduces debt)
        $debt = Debt::create([
            'supplier_id' => $supplier->id,
            'client_id' => null,
            'amount' => $validated['amount'],
            'type' => 'debit',
            'date' => now()->toDateString(),
            'notes' => $validated['notes'] ?? 'Payment to supplier',
            'reference' => 'PAY-' . strtoupper(uniqid()),
        ]);

        // Update supplier's total debt
        $supplier->total_debt = max(0, $supplier->total_debt - $validated['amount']);
        $supplier->save();

        // Mark stock entries as paid if fully paid
        $unpaidEntries = $supplier->stockEntries()->where('is_paid', false)->get();
        $remainingAmount = $validated['amount'];

        foreach ($unpaidEntries as $entry) {
            $entryTotal = $entry->quantity * $entry->unit_price;
            if ($remainingAmount >= $entryTotal) {
                $entry->is_paid = true;
                $entry->save();
                $remainingAmount -= $entryTotal;
            }
            if ($remainingAmount <= 0) break;
        }

        return response()->json([
            'message' => 'Payment recorded successfully',
            'debt' => $debt,
            'remaining_debt' => $supplier->total_debt,
        ]);
    }
}
