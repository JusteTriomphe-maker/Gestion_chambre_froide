<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Debt;
use App\Models\Client;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Middleware\RoleMiddleware;
use App\Support\NotifyDG;

class DebtController extends Controller
{
    /**
     * Display a listing of the debts.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Check view permission
        if (!RoleMiddleware::can($user, 'debts', 'view')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir les dettes.'], 403);
        }

        $query = Debt::with(['client', 'supplier']);

        if ($request->has('type') && $request->type) {
            $query->where('type', $request->type);
        }

        if ($request->has('client_id') && $request->client_id) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->has('supplier_id') && $request->supplier_id) {
            $query->where('supplier_id', $request->supplier_id);
        }

        $sortField = $request->get('sort_by', 'id');
        $sortDirection = $request->get('sort_dir', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $perPage = $request->get('per_page', 15);
        $debts = $query->paginate($perPage);

        return response()->json($debts);
    }

    /**
     * Store a newly created debt.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Check create permission
        if (!RoleMiddleware::can($user, 'debts', 'create')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de créer des dettes.'], 403);
        }

        $validated = $request->validate([
            'client_id' => 'nullable|exists:clients,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'amount' => 'required|numeric|min:0.01',
            'type' => 'required|in:credit,debit',
            'date' => 'required|date',
            'notes' => 'nullable|string',
            'reference' => 'nullable|string|max:255',
        ]);

        // Ensure at least one of client_id or supplier_id is provided
        if (!$validated['client_id'] && !$validated['supplier_id']) {
            return response()->json([
                'message' => 'Either client_id or supplier_id must be provided'
            ], 422);
        }

        $debt = Debt::create($validated);

        // Update the related entity's total debt
        if ($validated['client_id']) {
            $client = Client::find($validated['client_id']);
            if ($validated['type'] === 'credit') {
                $client->total_debt += $validated['amount'];
            } else {
                $client->total_debt = max(0, $client->total_debt - $validated['amount']);
            }
            $client->save();
        }

        if ($validated['supplier_id']) {
            $supplier = Supplier::find($validated['supplier_id']);
            if ($validated['type'] === 'debit') {
                $supplier->total_debt += $validated['amount'];
            } else {
                $supplier->total_debt = max(0, $supplier->total_debt - $validated['amount']);
            }
            $supplier->save();
        }

        $debt->load(['client', 'supplier']);

        NotifyDG::send('Nouvelle dette enregistrée', [
            "Type : {$debt->type}",
            "Montant : " . number_format((float) $debt->amount, 0, ',', ' ') . " FCFA",
            "Client : " . ($debt->client?->name ?? '-'),
            "Fournisseur : " . ($debt->supplier?->name ?? '-'),
            "Date : {$debt->date?->format('Y-m-d')}",
            "Référence : {$debt->reference}",
        ]);

        return response()->json([
            'message' => 'Debt created successfully',
            'debt' => $debt
        ], 201);
    }

    /**
     * Display the specified debt.
     */
    public function show(Request $request, Debt $debt): JsonResponse
    {
        $user = $request->user();
        
        // Check view permission
        if (!RoleMiddleware::can($user, 'debts', 'view')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir les dettes.'], 403);
        }

        $debt->load(['client', 'supplier']);
        return response()->json($debt);
    }

    /**
     * Update the specified debt.
     */
    public function update(Request $request, Debt $debt): JsonResponse
    {
        $user = $request->user();
        
        // Check edit permission
        if (!RoleMiddleware::can($user, 'debts', 'edit')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de modifier des dettes.'], 403);
        }

        $validated = $request->validate([
            'client_id' => 'nullable|exists:clients,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'amount' => 'sometimes|numeric|min:0.01',
            'type' => 'sometimes|in:credit,debit',
            'date' => 'sometimes|date',
            'notes' => 'nullable|string',
            'reference' => 'nullable|string|max:255',
        ]);

        $oldAmount = $debt->amount;
        $oldType = $debt->type;
        $oldClientId = $debt->client_id;
        $oldSupplierId = $debt->supplier_id;

        $debt->update($validated);

        // Recalculate related entity totals if amount or type changed
        if (isset($validated['amount']) || isset($validated['type'])) {
            // Reverse old effect
            if ($oldClientId) {
                $client = Client::find($oldClientId);
                if ($oldType === 'credit') {
                    $client->total_debt = max(0, $client->total_debt - $oldAmount);
                } else {
                    $client->total_debt += $oldAmount;
                }
                $client->save();
            }

            if ($oldSupplierId) {
                $supplier = Supplier::find($oldSupplierId);
                if ($oldType === 'debit') {
                    $supplier->total_debt = max(0, $supplier->total_debt - $oldAmount);
                } else {
                    $supplier->total_debt += $oldAmount;
                }
                $supplier->save();
            }

            // Apply new effect
            $newAmount = $validated['amount'] ?? $oldAmount;
            $newType = $validated['type'] ?? $oldType;
            $newClientId = $validated['client_id'] ?? $oldClientId;
            $newSupplierId = $validated['supplier_id'] ?? $oldSupplierId;

            if ($newClientId) {
                $client = Client::find($newClientId);
                if ($newType === 'credit') {
                    $client->total_debt += $newAmount;
                } else {
                    $client->total_debt = max(0, $client->total_debt - $newAmount);
                }
                $client->save();
            }

            if ($newSupplierId) {
                $supplier = Supplier::find($newSupplierId);
                if ($newType === 'debit') {
                    $supplier->total_debt += $newAmount;
                } else {
                    $supplier->total_debt = max(0, $supplier->total_debt - $newAmount);
                }
                $supplier->save();
            }
        }

        $debt->load(['client', 'supplier']);

        return response()->json([
            'message' => 'Debt updated successfully',
            'debt' => $debt
        ]);
    }

    /**
     * Remove the specified debt.
     */
    public function destroy(Request $request, Debt $debt): JsonResponse
    {
        $user = $request->user();
        
        // Check delete permission
        if (!RoleMiddleware::can($user, 'debts', 'delete')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de supprimer des dettes.'], 403);
        }

        // Reverse the debt from the related entity
        if ($debt->client_id) {
            $client = $debt->client;
            if ($debt->type === 'credit') {
                $client->total_debt = max(0, $client->total_debt - $debt->amount);
            } else {
                $client->total_debt += $debt->amount;
            }
            $client->save();
        }

        if ($debt->supplier_id) {
            $supplier = $debt->supplier;
            if ($debt->type === 'debit') {
                $supplier->total_debt = max(0, $supplier->total_debt - $debt->amount);
            } else {
                $supplier->total_debt += $debt->amount;
            }
            $supplier->save();
        }

        $debt->delete();

        return response()->json([
            'message' => 'Debt deleted successfully'
        ]);
    }

    /**
     * Get debt summary.
     */
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Check view permission
        if (!RoleMiddleware::can($user, 'debts', 'view')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir les dettes.'], 403);
        }

        $totalFromClients = Debt::where('type', 'credit')
            ->whereNotNull('client_id')
            ->sum('amount');

        $totalToSuppliers = Debt::where('type', 'debit')
            ->whereNotNull('supplier_id')
            ->sum('amount');

        $clientDebts = Debt::where('type', 'credit')
            ->whereNotNull('client_id')
            ->selectRaw('client_id, SUM(amount) as total')
            ->groupBy('client_id')
            ->with('client:id,name')
            ->get();

        $supplierDebts = Debt::where('type', 'debit')
            ->whereNotNull('supplier_id')
            ->selectRaw('supplier_id, SUM(amount) as total')
            ->groupBy('supplier_id')
            ->with('supplier:id,name')
            ->get();

        return response()->json([
            'total_from_clients' => $totalFromClients,
            'total_to_suppliers' => $totalToSuppliers,
            'net_position' => $totalFromClients - $totalToSuppliers,
            'client_debts' => $clientDebts,
            'supplier_debts' => $supplierDebts,
        ]);
    }

    /**
     * Pay a specific debt.
     */
    public function pay(Request $request, Debt $debt): JsonResponse
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

        if ($validated['amount'] > $debt->amount) {
            return response()->json([
                'message' => 'Payment amount cannot exceed debt amount'
            ], 422);
        }

        // Create a payment (opposite type of debt)
        $paymentType = $debt->type === 'credit' ? 'debit' : 'credit';

        $payment = Debt::create([
            'client_id' => $debt->client_id,
            'supplier_id' => $debt->supplier_id,
            'amount' => $validated['amount'],
            'type' => $paymentType,
            'date' => now()->toDateString(),
            'notes' => $validated['notes'] ?? 'Payment for debt #' . $debt->id,
            'reference' => 'PAY-' . strtoupper(uniqid()),
        ]);

        // Update original debt amount
        $debt->amount -= $validated['amount'];
        if ($debt->amount <= 0) {
            $debt->delete();
        } else {
            $debt->save();
        }

        // Update related entity totals
        if ($debt->client_id) {
            $client = Client::find($debt->client_id);
            if ($debt->type === 'credit') {
                $client->total_debt = max(0, $client->total_debt - $validated['amount']);
            } else {
                $client->total_debt += $validated['amount'];
            }
            $client->save();
        }

        if ($debt->supplier_id) {
            $supplier = Supplier::find($debt->supplier_id);
            if ($debt->type === 'debit') {
                $supplier->total_debt = max(0, $supplier->total_debt - $validated['amount']);
            } else {
                $supplier->total_debt += $validated['amount'];
            }
            $supplier->save();
        }

        return response()->json([
            'message' => 'Payment recorded successfully',
            'payment' => $payment,
        ]);
    }
}
