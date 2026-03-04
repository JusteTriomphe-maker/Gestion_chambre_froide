<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Debt;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Middleware\RoleMiddleware;

class ClientController extends Controller
{
    /**
     * Display a listing of the clients.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Check view permission
        if (!RoleMiddleware::can($user, 'clients', 'view')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir les clients.'], 403);
        }

        $query = Client::query();

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $sortField = $request->get('sort_by', 'id');
        $sortDirection = $request->get('sort_dir', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $perPage = $request->get('per_page', 15);
        $clients = $query->paginate($perPage);

        return response()->json($clients);
    }

    /**
     * Store a newly created client.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Check create permission
        if (!RoleMiddleware::can($user, 'clients', 'create')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de créer des clients.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_info' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'total_debt' => 'nullable|numeric|min:0',
        ]);

        $client = Client::create($validated);

        return response()->json([
            'message' => 'Client created successfully',
            'client' => $client
        ], 201);
    }

    /**
     * Display the specified client.
     */
    public function show(Request $request, Client $client): JsonResponse
    {
        $user = $request->user();
        
        // Check view permission
        if (!RoleMiddleware::can($user, 'clients', 'view')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir les clients.'], 403);
        }

        $client->load(['stockExits', 'debts']);
        return response()->json($client);
    }

    /**
     * Update the specified client.
     */
    public function update(Request $request, Client $client): JsonResponse
    {
        $user = $request->user();
        
        // Check edit permission
        if (!RoleMiddleware::can($user, 'clients', 'edit')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de modifier des clients.'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'contact_info' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'total_debt' => 'nullable|numeric|min:0',
        ]);

        $client->update($validated);

        return response()->json([
            'message' => 'Client updated successfully',
            'client' => $client
        ]);
    }

    /**
     * Remove the specified client.
     */
    public function destroy(Request $request, Client $client): JsonResponse
    {
        $user = $request->user();
        
        // Check delete permission
        if (!RoleMiddleware::can($user, 'clients', 'delete')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de supprimer des clients.'], 403);
        }

        if ($client->stockExits()->count() > 0 || $client->debts()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete client with existing stock exits or debts'
            ], 422);
        }

        $client->delete();

        return response()->json([
            'message' => 'Client deleted successfully'
        ]);
    }

    /**
     * Get debts for a client.
     */
    public function debts(Request $request, Client $client): JsonResponse
    {
        $user = $request->user();
        
        // Check view permission
        if (!RoleMiddleware::can($user, 'clients', 'view')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir les clients.'], 403);
        }

        $debts = $client->debts()->orderBy('date', 'desc')->get();
        return response()->json($debts);
    }

    /**
     * Pay debt for a client.
     */
    public function payDebt(Request $request, Client $client): JsonResponse
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

        $debt = Debt::create([
            'client_id' => $client->id,
            'supplier_id' => null,
            'amount' => $validated['amount'],
            'type' => 'credit',
            'date' => now()->toDateString(),
            'notes' => $validated['notes'] ?? 'Payment from client',
            'reference' => 'PAY-' . strtoupper(uniqid()),
        ]);

        $client->total_debt = max(0, $client->total_debt - $validated['amount']);
        $client->save();

        $unpaidExits = $client->stockExits()->where('is_paid', false)->get();
        $remainingAmount = $validated['amount'];

        foreach ($unpaidExits as $exit) {
            $exitTotal = $exit->quantity * $exit->unit_price;
            if ($remainingAmount >= $exitTotal) {
                $exit->is_paid = true;
                $exit->save();
                $remainingAmount -= $exitTotal;
            }
            if ($remainingAmount <= 0) break;
        }

        return response()->json([
            'message' => 'Payment recorded successfully',
            'debt' => $debt,
            'remaining_debt' => $client->total_debt,
        ]);
    }
}
