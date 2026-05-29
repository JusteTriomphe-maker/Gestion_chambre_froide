<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class PermissionController extends Controller
{
    /**
     * Get current user's permissions
     * Optimisé avec mise en cache
     */
    public function current(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Cache key par utilisateur
        $cacheKey = "permissions_user_{$user->id}";
        
        // Essayer d'utiliser le cache
        $permissions = Cache::remember($cacheKey, 300, function () use ($user) {
            return RoleMiddleware::getPermissionsForFrontend($user);
        });

        // Forcer le cache si demandé
        if ($request->has('refresh') && $request->boolean('refresh')) {
            Cache::forget($cacheKey);
            $permissions = RoleMiddleware::getPermissionsForFrontend($user);
        }
        
        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'role_label' => RoleMiddleware::getRoleLabel($user->role),
                'role_color' => RoleMiddleware::getRoleColor($user->role),
                'is_active' => $user->is_active,
            ],
            'permissions' => RoleMiddleware::getAllPermissions($user),
            'allowed_modules' => RoleMiddleware::getAllowedModules($user),
            'can' => $permissions['can'] ?? [],
            // Raccourcis de rôle
            'is_dg' => RoleMiddleware::isDG($user),
            'is_gerant' => RoleMiddleware::isGerant($user),
            'is_caissier' => RoleMiddleware::isCaissier($user),
            'is_magasinier' => RoleMiddleware::isMagasinier($user),
            'is_comptable' => RoleMiddleware::isComptable($user),
            // Permissions spéciales
            'can_manage_users' => RoleMiddleware::canManageUsers($user),
            'can_view_reports' => RoleMiddleware::canViewReports($user),
        ]);
    }

    /**
     * Get all available roles (for user management)
     */
    public function roles(): JsonResponse
    {
        $roles = [];
        foreach (RoleMiddleware::getAllRoles() as $role) {
            $roles[] = [
                'value' => $role,
                'label' => RoleMiddleware::getRoleLabel($role),
                'color' => RoleMiddleware::getRoleColor($role),
                'permissions' => RoleMiddleware::getPermissionsForRole($role),
            ];
        }

        return response()->json([
            'roles' => $roles,
            'count' => count($roles),
        ]);
    }

    /**
     * Get permission matrix (all roles x all modules x all actions)
     */
    public function matrix(): JsonResponse
    {
        // Cette info peut être mise en cache car elle ne change pas souvent
        return response()->json([
            'matrix' => [
                'roles' => RoleMiddleware::getAllRoles(),
                'modules' => array_keys(RoleMiddleware::MODULES),
                'actions' => array_keys(RoleMiddleware::ACTIONS),
                'permissions' => collect(RoleMiddleware::getAllRoles())
                    ->mapWithKeys(fn ($role) => [$role => RoleMiddleware::getPermissionsForRole($role)])
                    ->all(),
            ],
        ]);
    }

    /**
     * Check specific permission
     */
    public function check(Request $request): JsonResponse
    {
        $request->validate([
            'module' => 'required|string',
            'action' => 'required|string',
        ]);

        $user = $request->user();
        $module = $request->input('module');
        $action = $request->input('action', 'view');

        $hasPermission = RoleMiddleware::can($user, $module, $action);

        return response()->json([
            'has_permission' => $hasPermission,
            'module' => $module,
            'action' => $action,
            'role' => $user->role,
            'role_label' => RoleMiddleware::getRoleLabel($user->role),
        ]);
    }

    /**
     * Check multiple permissions at once
     */
    public function checkMultiple(Request $request): JsonResponse
    {
        $request->validate([
            'permissions' => 'required|array',
            'permissions.*.module' => 'required|string',
            'permissions.*.action' => 'required|string',
        ]);

        $user = $request->user();
        $permissions = $request->input('permissions');

        $results = [];
        foreach ($permissions as $perm) {
            $module = $perm['module'];
            $action = $perm['action'];
            
            $results[] = [
                'module' => $module,
                'action' => $action,
                'has_permission' => RoleMiddleware::can($user, $module, $action),
            ];
        }

        return response()->json([
            'results' => $results,
            'all_granted' => collect($results)->every('has_permission', true),
            'any_granted' => collect($results)->contains('has_permission', true),
        ]);
    }

    /**
     * Get role information
     */
    public function roleInfo(Request $request): JsonResponse
    {
        $request->validate([
            'role' => 'required|string',
        ]);

        $role = $request->input('role');

        if (!RoleMiddleware::roleExists($role)) {
            return response()->json([
                'message' => 'Rôle non trouvé',
            ], 404);
        }

        return response()->json(
            RoleMiddleware::getRoleInfo($role)
        );
    }

    /**
     * Clear permissions cache (for admin use)
     */
    public function clearCache(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Only admins can clear cache
        if (!RoleMiddleware::canManageUsers($user)) {
            return response()->json([
                'message' => 'Accès refusé. Vous n\'avez pas la permission de gérer le cache.'
            ], 403);
        }

        // Clear all permission caches
        Cache::flush();

        return response()->json([
            'message' => 'Cache des permissions effacé avec succès'
        ]);
    }
}
