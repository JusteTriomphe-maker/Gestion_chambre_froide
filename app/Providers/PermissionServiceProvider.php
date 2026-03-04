<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Http\Middleware\RoleMiddleware;

class PermissionServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Enregistrer les permissions comme configuration
        $this->app->singleton('permissions', function () {
            return RoleMiddleware::PERMISSIONS;
        });

        $this->app->singleton('role-labels', function () {
            return RoleMiddleware::ROLE_LABELS;
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Partager les permissions avec toutes les vues
        view()->composer('*', function ($view) {
            if (auth()->check()) {
                $user = auth()->user();
                $view->with('permissions', RoleMiddleware::getPermissionsForFrontend($user));
                $view->with('role_label', RoleMiddleware::getRoleLabel($user->role));
                $view->with('role_color', RoleMiddleware::getRoleColor($user->role));
            }
        });
    }

    /**
     * Obtenir la matrice complète des permissions (pour l'interface d'administration)
     * Note: Cette méthode retourne les permissions statiques définies dans RoleMiddleware
     */
    public static function getPermissionMatrix(): array
    {
        $matrix = [];
        $modules = array_keys(RoleMiddleware::MODULES);
        $actions = array_keys(RoleMiddleware::ACTIONS);
        $roles = array_keys(RoleMiddleware::ROLE_LABELS);

        foreach ($roles as $role) {
            $matrix[$role] = [
                'label' => RoleMiddleware::ROLE_LABELS[$role],
                'permissions' => []
            ];

            foreach ($modules as $module) {
                $matrix[$role]['permissions'][$module] = [];
                foreach ($actions as $action) {
                    $matrix[$role]['permissions'][$module][$action] = 
                        in_array($action, RoleMiddleware::PERMISSIONS[$role][$module] ?? []);
                }
            }
        }

        return $matrix;
    }

    /**
     * Obtenir les permissions pour un rôle spécifique
     */
    public static function getRolePermissions(string $role): array
    {
        return RoleMiddleware::PERMISSIONS[$role] ?? [];
    }

    /**
     * Obtenir la liste des modules disponibles
     */
    public static function getModules(): array
    {
        return RoleMiddleware::MODULES;
    }

    /**
     * Obtenir la liste des actions disponibles
     */
    public static function getActions(): array
    {
        return RoleMiddleware::ACTIONS;
    }

    /**
     * Obtenir la liste des rôles disponibles
     */
    public static function getRoles(): array
    {
        return RoleMiddleware::ROLE_LABELS;
    }
}
