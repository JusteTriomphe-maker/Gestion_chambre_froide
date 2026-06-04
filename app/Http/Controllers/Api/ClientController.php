<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Debt;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Middleware\RoleMiddleware;
use App\Support\NotifyDG;

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
        
        // Check delete permission + rôle (seulement DG / Gérant)
        if (!RoleMiddleware::can($user, 'clients', 'delete') || !in_array($user->role, ['dg', 'gerant'], true)) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de supprimer des clients.'], 403);
        }

        // Empêcher la suppression si dette restante
        if ($client->total_debt > 0) {
            return response()->json([
                'message' => 'Impossible de supprimer ce client : une dette reste à payer.',
            ], 422);
        }

        // Garder la protection existante (liens forts)
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
        
        // Check pay permission (module dettes) + rôle (DG / Gérant uniquement)
        if (!RoleMiddleware::can($user, 'debts', 'pay') || !in_array($user->role, ['dg', 'gerant'], true)) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de payer des dettes.'], 403);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string',
        ]);

        $currentDebt = (float) $client->total_debt;
        $paymentAmount = (float) $validated['amount'];

        if ($currentDebt <= 0) {
            return response()->json([
                'message' => 'Ce client n\'a pas de dette à payer.',
                'remaining_debt' => 0,
            ], 422);
        }

        if ($paymentAmount > $currentDebt) {
            return response()->json([
                'message' => 'Le montant payé ne peut pas dépasser la dette actuelle.',
                'current_debt' => $currentDebt,
            ], 422);
        }

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $type = $paymentAmount >= $currentDebt ? Payment::TYPE_FULL : Payment::TYPE_PARTIAL;

            // Enregistrer le paiement dans la table dédiée
            $payment = Payment::create([
                'client_id' => $client->id,
                'amount'    => $paymentAmount,
                'type'      => $type,
            ]);

            // Mettre à jour la dette agrégée du client
            $client->total_debt = max(0, $currentDebt - $paymentAmount);
            $client->save();

            // ---------------------------------------------------------------
            // Marquer les ventes impayées comme payées (chiffre d'affaires)
            // On solde les ventes les plus anciennes en premier
            // ---------------------------------------------------------------
            $unpaidSales = \App\Models\Sale::where('client_id', $client->id)
                ->where('is_paid', false)
                ->with('items')
                ->orderBy('sale_date')
                ->orderBy('id')
                ->get();

            $remainingForSales = $paymentAmount;
            foreach ($unpaidSales as $sale) {
                $saleTotal = $sale->items->sum(fn($item) => (float) $item->subtotal);
                if ($saleTotal <= 0) continue;

                if ($remainingForSales >= $saleTotal) {
                    $sale->is_paid  = true;
                    $sale->paid_at  = now();
                    $sale->save();
                    $remainingForSales -= $saleTotal;
                }
                if ($remainingForSales <= 0) break;
            }

            // Marquer aussi les sorties de stock impayées
            $unpaidExits = $client->stockExits()->where('is_paid', false)->get();
            $remainingForExits = $paymentAmount;
            foreach ($unpaidExits as $exit) {
                $exitTotal = (float) $exit->quantity * (float) $exit->unit_price;
                if ($remainingForExits >= $exitTotal) {
                    $exit->is_paid = true;
                    $exit->save();
                    $remainingForExits -= $exitTotal;
                }
                if ($remainingForExits <= 0) break;
            }

            \Illuminate\Support\Facades\DB::commit();

            NotifyDG::send('Paiement de dette client', [
                "Client : {$client->name}",
                "Type : " . ($type === Payment::TYPE_FULL ? 'Paiement total' : 'Paiement partiel'),
                "Montant payé : " . number_format($paymentAmount, 0, ',', ' ') . " FCFA",
                "Dette avant : " . number_format($currentDebt, 0, ',', ' ') . " FCFA",
                "Dette restante : " . number_format((float) $client->total_debt, 0, ',', ' ') . " FCFA",
                "Effectué par : {$user->name} ({$user->role})",
            ]);

            return response()->json([
                'message'      => 'Paiement enregistré avec succès',
                'payment'      => $payment,
                'payment_type' => $type,
                'remaining_debt' => $client->total_debt,
            ]);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }
}
