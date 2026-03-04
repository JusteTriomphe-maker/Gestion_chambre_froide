<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    // Permissions par rôle - SEUL LE DG PEUT SUPPRIMER
    // Actions: view, create, edit, delete, pay, export
    private const PERMISSIONS = [
        'dg' => [
            'products' => ['view', 'create', 'edit', 'delete', 'export'],
            'clients' => ['view', 'create', 'edit', 'delete', 'export'],
            'suppliers' => ['view', 'create', 'edit', 'delete', 'export'],
            'stock-entries' => ['view', 'create', 'edit', 'delete', 'export'],
            'stock-exits' => ['view', 'create', 'edit', 'delete', 'export'],
            'debts' => ['view', 'create', 'edit', 'delete', 'pay', 'export'],
            'users' => ['view', 'create', 'edit', 'delete', 'export'],
            'dashboard' => ['view', 'export'],
            'reports' => ['view', 'export'],
            'settings' => ['view', 'edit', 'delete'],
            'sales' => ['view', 'create', 'delete', 'export'],
        ],
        'gerant' => [
            'products' => ['view', 'create', 'edit', 'export'],
            'clients' => ['view', 'create', 'edit', 'export'],
            'suppliers' => ['view', 'create', 'edit', 'export'],
            'stock-entries' => ['view', 'create', 'edit', 'export'],
            'stock-exits' => ['view', 'create', 'edit', 'export'],
            'debts' => ['view', 'create', 'edit', 'pay', 'export'],
            'users' => ['view'],
            'dashboard' => ['view', 'export'],
            'reports' => ['view', 'export'],
            'settings' => ['view', 'edit'],
            'sales' => ['view', 'create', 'export'],
        ],
        'caissier' => [
            'products' => ['view'],
            'clients' => ['view', 'create'],
            'suppliers' => [],
            'stock-entries' => [],
            'stock-exits' => ['view', 'create'],
            'debts' => ['view', 'pay'],
            'users' => [],
            'dashboard' => ['view'],
            'reports' => [],
            'settings' => [],
            'sales' => ['view', 'create'],
        ],
        'comptable' => [
            'products' => ['view', 'export'],
            'clients' => ['view', 'export'],
            'suppliers' => ['view', 'export'],
            'stock-entries' => ['view', 'export'],
            'stock-exits' => ['view', 'export'],
            'debts' => ['view', 'create', 'edit', 'pay', 'export'],
            'users' => [],
            'dashboard' => ['view', 'export'],
            'reports' => ['view', 'export'],
            'settings' => [],
            'sales' => ['view', 'export'],
        ],
    ];

    // Modules disponibles dans l'application
    public const MODULES = [
        'products' => [
            'label' => 'Produits',
            'icon' => 'cube',
            'description' => 'Gestion des produits'
        ],
        'clients' => [
            'label' => 'Clients',
            'icon' => 'users',
            'description' => 'Gestion des clients'
        ],
        'suppliers' => [
            'label' => 'Fournisseurs',
            'icon' => 'truck',
            'description' => 'Gestion des fournisseurs'
        ],
        'stock-entries' => [
            'label' => 'Entrées Stock',
            'icon' => 'arrow-down-circle',
            'description' => 'Gestion des entrées en stock'
        ],
        'stock-exits' => [
            'label' => 'Sorties Stock',
            'icon' => 'arrow-up-circle',
            'description' => 'Gestion des sorties de stock'
        ],
        'debts' => [
            'label' => 'Dettes',
            'icon' => 'credit-card',
            'description' => 'Gestion des dettes clients'
        ],
        'users' => [
            'label' => 'Utilisateurs',
            'icon' => 'user-cog',
            'description' => 'Gestion des utilisateurs'
        ],
        'dashboard' => [
            'label' => 'Tableau de bord',
            'icon' => 'home',
            'description' => 'Vue d\'ensemble'
        ],
        'reports' => [
            'label' => 'Rapports',
            'icon' => 'chart-bar',
            'description' => 'Rapports et statistiques'
        ],
        'settings' => [
            'label' => 'Paramètres',
            'icon' => 'cog',
            'description' => 'Configuration du système'
        ],
        'sales' => [
            'label' => 'Ventes',
            'icon' => 'currency-dollar',
            'description' => 'Gestion des ventes et reçus'
        ],
    ];

    // Actions disponibles
    public const ACTIONS = [
        'view' => [
            'label' => 'Voir',
            'description' => 'Voir la liste et les détails'
        ],
        'create' => [
            'label' => 'Créer',
            'description' => 'Créer de nouveaux enregistrements'
        ],
        'edit' => [
            'label' => 'Modifier',
            'description' => 'Modifier les enregistrements existants'
        ],
        'delete' => [
            'label' => 'Supprimer',
            'description' => 'Supprimer les enregistrements'
        ],
        'export' => [
            'label' => 'Exporter',
            'description' => 'Exporter les données'
        ],
        'pay' => [
            'label' => 'Payer',
            'description' => 'Effectuer des paiements'
        ],
    ];

    // Labels pour l'affichage
    public const ROLE_LABELS = [
        'dg' => 'Directeur Général',
        'gerant' => 'Gérant',
        'caissier' => 'Caissier',
        'comptable' => 'Comptable',
    ];

    // Couleurs par rôle
    public const ROLE_COLORS = [
        'dg' => 'red',
        'gerant' => 'purple',
        'caissier' => 'blue',
        'comptable' => 'amber',
    ];

    // Rôles qui peuvent gérer les utilisateurs
    public const CAN_MANAGE_USERS = ['dg'];

    // Rôles qui peuvent voir les rapports
    public const CAN_VIEW_REPORTS = ['dg', 'gerant', 'comptable'];

    public function handle(Request $request, Closure $next, string $module, string $action = 'view'): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        // Vérifier si l'utilisateur est actif
        if (!$user->is_active) {
            return response()->json(['message' => 'Compte désactivé. Veuillez contacter l\'administrateur.'], 403);
        }

        // DG a toujours accès complet
        if ($user->role === 'dg') {
            return $next($request);
        }

        // Vérifier si le rôle a la permission
        $hasPermission = self::can($user, $module, $action);

        if (!$hasPermission) {
            return response()->json([
                'message' => "Accès refusé. Vous n'avez pas la permission pour cette action.",
                'required' => $action,
                'module' => $module,
                'role' => $user->role,
                'role_label' => self::getRoleLabel($user->role),
            ], 403);
        }

        return $next($request);
    }

    /**
     * Vérifie si un utilisateur a une permission spécifique
     */
    public static function can(User $user, string $module, string $action = 'view'): bool
    {
        // Vérifier si l'utilisateur est actif
        if (!$user->is_active) {
            return false;
        }

        // DG a toujours accès
        if ($user->role === 'dg') {
            return true;
        }

        $permissions = self::PERMISSIONS[$user->role] ?? [];
        $modulePermissions = $permissions[$module] ?? [];

        return in_array($action, $modulePermissions);
    }

    /**
     * Vérifie si un utilisateur peut accéder à un module (quelle que soit l'action)
     */
    public static function canAccessModule(User $user, string $module): bool
    {
        // Vérifier si l'utilisateur est actif
        if (!$user->is_active) {
            return false;
        }

        // DG a toujours accès
        if ($user->role === 'dg') {
            return true;
        }

        $permissions = self::PERMISSIONS[$user->role] ?? [];
        $modulePermissions = $permissions[$module] ?? [];

        return !empty($modulePermissions);
    }

    /**
     * Obtient les modules accessibles avec leurs permissions
     */
    public static function getAllowedModules(User $user): array
    {
        if ($user->role === 'dg') {
            return array_keys(self::PERMISSIONS['dg']);
        }

        return array_keys(self::PERMISSIONS[$user->role] ?? []);
    }

    /**
     * Obtient les permissions détaillées pour un module
     */
    public static function getModulePermissions(User $user, string $module): array
    {
        if ($user->role === 'dg') {
            return self::PERMISSIONS['dg'][$module] ?? [];
        }

        return self::PERMISSIONS[$user->role][$module] ?? [];
    }

    /**
     * Obtient toutes les permissions d'un utilisateur
     */
    public static function getAllPermissions(User $user): array
    {
        if ($user->role === 'dg') {
            return self::PERMISSIONS['dg'];
        }

        return self::PERMISSIONS[$user->role] ?? [];
    }

    /**
     * Vérifie si l'utilisateur peut supprimer (SEUL DG)
     */
    public static function canDelete(User $user, string $module): bool
    {
        // Seul le DG peut supprimer
        if ($user->role === 'dg') {
            return true;
        }
        return false;
    }

    /**
     * Vérifie si l'utilisateur peut créer
     */
    public static function canCreate(User $user, string $module): bool
    {
        return self::can($user, $module, 'create');
    }

    /**
     * Vérifie si l'utilisateur peut modifier
     */
    public static function canEdit(User $user, string $module): bool
    {
        return self::can($user, $module, 'edit');
    }

    /**
     * Vérifie si l'utilisateur peut voir
     */
    public static function canView(User $user, string $module): bool
    {
        return self::can($user, $module, 'view');
    }

    /**
     * Vérifie si l'utilisateur peut exporter
     */
    public static function canExport(User $user, string $module): bool
    {
        return self::can($user, $module, 'export');
    }

    /**
     * Vérifie si l'utilisateur peut payer
     */
    public static function canPay(User $user, string $module): bool
    {
        return self::can($user, $module, 'pay');
    }

    /**
     * Vérifie si l'utilisateur peut gérer les utilisateurs
     */
    public static function canManageUsers(User $user): bool
    {
        return in_array($user->role, self::CAN_MANAGE_USERS);
    }

    /**
     * Vérifie si l'utilisateur peut voir les rapports
     */
    public static function canViewReports(User $user): bool
    {
        return in_array($user->role, self::CAN_VIEW_REPORTS);
    }

    /**
     * Vérifie si l'utilisateur est DG
     */
    public static function isDG(User $user): bool
    {
        return $user->role === 'dg';
    }

    /**
     * Vérifie si l'utilisateur est Gérant
     */
    public static function isGerant(User $user): bool
    {
        return $user->role === 'gerant';
    }

    /**
     * Vérifie si l'utilisateur est Caissier
     */
    public static function isCaissier(User $user): bool
    {
        return $user->role === 'caissier';
    }

    /**
     * Vérifie si l'utilisateur est Comptable
     */
    public static function isComptable(User $user): bool
    {
        return $user->role === 'comptable';
    }

    /**
     * Obtient le label du rôle
     */
    public static function getRoleLabel(string $role): string
    {
        return self::ROLE_LABELS[$role] ?? $role;
    }

    /**
     * Obtient la couleur du rôle
     */
    public static function getRoleColor(string $role): string
    {
        return self::ROLE_COLORS[$role] ?? 'gray';
    }

    /**
     * Liste tous les rôles disponibles
     */
    public static function getAllRoles(): array
    {
        return array_keys(self::ROLE_LABELS);
    }

    /**
     * Vérifie si un rôle existe
     */
    public static function roleExists(string $role): bool
    {
        return array_key_exists($role, self::ROLE_LABELS);
    }

    /**
     * Obtient la liste des modules disponibles
     */
    public static function getAllModules(): array
    {
        return self::MODULES;
    }

    /**
     * Obtient la liste des actions disponibles
     */
    public static function getAllActions(): array
    {
        return self::ACTIONS;
    }

    /**
     * Obtient les informations complètes d'un rôle (label, permissions, couleur)
     */
    public static function getRoleInfo(string $role): array
    {
        return [
            'value' => $role,
            'label' => self::getRoleLabel($role),
            'color' => self::getRoleColor($role),
            'permissions' => self::PERMISSIONS[$role] ?? [],
        ];
    }

    /**
     * Vérifie si l'utilisateur a au moins une des permissions spécifiées
     */
    public static function canAny(User $user, string $module, array $actions): bool
    {
        foreach ($actions as $action) {
            if (self::can($user, $module, $action)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Vérifie si l'utilisateur a toutes les permissions spécifiées
     */
    public static function canAll(User $user, string $module, array $actions): bool
    {
        foreach ($actions as $action) {
            if (!self::can($user, $module, $action)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Obtient les permissions au format JSON pour le frontend
     */
    public static function getPermissionsForFrontend(User $user): array
    {
        $permissions = self::getAllPermissions($user);
        $allowedModules = self::getAllowedModules($user);

        $can = [];
        foreach (self::MODULES as $module => $info) {
            $can[$module] = [
                'view' => self::can($user, $module, 'view'),
                'create' => self::can($user, $module, 'create'),
                'edit' => self::can($user, $module, 'edit'),
                'delete' => self::canDelete($user, $module),
                'export' => self::can($user, $module, 'export'),
                'pay' => self::can($user, $module, 'pay'),
            ];
        }

        return [
            'can' => $can,
            'allowed_modules' => $allowedModules,
            'is_dg' => self::isDG($user),
            'is_gerant' => self::isGerant($user),
            'is_caissier' => self::isCaissier($user),
            'is_comptable' => self::isComptable($user),
            'can_manage_users' => self::canManageUsers($user),
            'can_view_reports' => self::canViewReports($user),
        ];
    }
}
