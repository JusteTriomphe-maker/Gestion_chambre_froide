<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleAccessMiddleware
{
    /**
     * Handle an incoming request.
     * Vérifie si l'utilisateur a accès au module demandé
     */
    public function handle(Request $request, Closure $next, string $module): Response
    {
        $user = $request->user();

        // Si pas d'utilisateur, rediriger vers login
        if (!$user) {
            return redirect()->route('login');
        }

        // Vérifier si l'utilisateur est actif
        if (isset($user->is_active) && !$user->is_active) {
            return $this->deniedResponse($request, 'Votre compte a été désactivé. Veuillez contacter l\'administrateur.');
        }

        // Vérifier l'accès au module
        if (!$this->hasAccess($user->role, $module)) {
            return $this->deniedResponse($request, "Accès refusé : vous n'avez pas la permission d'accéder à ce module.");
        }

        return $next($request);
    }

    /**
     * Vérifie si le rôle a accès au module
     */
    private function hasAccess(string $role, string $module): bool
    {
        $permissions = $this->getRolePermissions();

        // DG a toujours accès
        if ($role === 'dg') {
            return true;
        }

        // Vérifier si le rôle existe et a accès au module
        return isset($permissions[$role]) && in_array($module, $permissions[$role]);
    }

    /**
     * Définition des permissions par rôle
     */
    private function getRolePermissions(): array
    {
        return [
            // Directeur Général - Accès complet
            'dg' => [
                'dashboard',
                'products',
                'clients',
                'suppliers',
                'stock-entries',
                'stock-exits',
                'debts',
                'users',
                'sales',
                'revenue',
            ],

            // Gérant (Responsable Stock)
            'gerant' => [
                'dashboard',
                'products',
                'stock-entries',
                'stock-exits',
            ],

            // Caissier / Caissière
            'caissier' => [
                'dashboard',
                'clients',
                'stock-exits',
                'sales',
            ],

            // Comptable
            'comptable' => [
                'dashboard',
                'revenue',
                'debts',
            ],
        ];
    }

    /**
     * Retourne la réponse d'accès refusé
     */
    private function deniedResponse(Request $request, string $message): Response
    {
        // Si c'est une requête AJAX/API
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => $message,
                'error' => 'access_denied'
            ], 403);
        }

        // Si c'est une requête Inertia (React)
        if ($request->header('X-Inertia')) {
            return inertia('Errors/403', [
                'message' => $message,
                'status' => 403,
            ])->toResponse($request)->setStatusCode(403);
        }

        // Sinon, rediriger vers le dashboard avec message d'erreur
        return redirect()->route('dashboard')->with('error', $message);
    }
}
