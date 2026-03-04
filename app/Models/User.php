<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Http\Middleware\RoleMiddleware;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'permissions',
        'is_active',
        'last_login',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'role' => 'string',
        'is_active' => 'boolean',
        'last_login' => 'datetime',
    ];

    // Role constants - Using RoleMiddleware constants
    public const ROLE_DG = RoleMiddleware::ROLE_LABELS['dg'] ?? 'dg';
    public const ROLE_GERANT = 'gerant';
    public const ROLE_CAISSIER = 'caissier';
    public const ROLE_COMPTABLE = 'comptable';

    /**
     * Get role label from RoleMiddleware
     */
    public static function roleLabels(): array
    {
        return RoleMiddleware::ROLE_LABELS;
    }

    /**
     * Get user's role label
     */
    public function getRoleLabel(): string
    {
        return RoleMiddleware::getRoleLabel($this->role);
    }

    /**
     * Get user's role color
     */
    public function getRoleColor(): string
    {
        return RoleMiddleware::getRoleColor($this->role);
    }

    // Check if user is DG
    public function isDG(): bool
    {
        return RoleMiddleware::isDG($this);
    }

    // Check if user is Gerant
    public function isGerant(): bool
    {
        return RoleMiddleware::isGerant($this);
    }

    // Check if user is Caissier
    public function isCaissier(): bool
    {
        return RoleMiddleware::isCaissier($this);
    }

    // Check if user is Magasinier
    public function isMagasinier(): bool
    {
        return RoleMiddleware::isMagasinier($this);
    }

    // Check if user is Comptable
    public function isComptable(): bool
    {
        return RoleMiddleware::isComptable($this);
    }

    // Check if user can access module
    public function canAccess(string $module): bool
    {
        return RoleMiddleware::canAccessModule($this, $module);
    }

    // Check if user can perform action (using different name to avoid conflict with Laravel's can())
    public function canPerform(string $module, string $action = 'view'): bool
    {
        return RoleMiddleware::can($this, $module, $action);
    }

    // Check if user can delete
    public function canDelete(string $module): bool
    {
        return RoleMiddleware::canDelete($this, $module);
    }

    // Check if user can create
    public function canCreate(string $module): bool
    {
        return RoleMiddleware::canCreate($this, $module);
    }

    // Check if user can edit
    public function canEdit(string $module): bool
    {
        return RoleMiddleware::canEdit($this, $module);
    }

    // Check if user can view
    public function canView(string $module): bool
    {
        return RoleMiddleware::canView($this, $module);
    }

    // Check if user can export
    public function canExport(string $module): bool
    {
        return RoleMiddleware::canExport($this, $module);
    }

    // Check if user can pay
    public function canPay(string $module): bool
    {
        return RoleMiddleware::canPay($this, $module);
    }

    // Check if user can manage users
    public function canManageUsers(): bool
    {
        return RoleMiddleware::canManageUsers($this);
    }

    // Check if user can view reports
    public function canViewReports(): bool
    {
        return RoleMiddleware::canViewReports($this);
    }

    // Get allowed modules
    public function getAllowedModules(): array
    {
        return RoleMiddleware::getAllowedModules($this);
    }

    // Get all permissions
    public function getAllPermissions(): array
    {
        return RoleMiddleware::getAllPermissions($this);
    }

    // Get permissions for frontend
    public function getPermissionsForFrontend(): array
    {
        return RoleMiddleware::getPermissionsForFrontend($this);
    }

    // Check if user is active
    public function isActiveUser(): bool
    {
        return $this->is_active ?? true;
    }

    /**
     * Get all available roles for selection
     */
    public static function getAvailableRoles(): array
    {
        $roles = [];
        foreach (RoleMiddleware::getAllRoles() as $role) {
            $roles[] = [
                'value' => $role,
                'label' => RoleMiddleware::getRoleLabel($role),
            ];
        }
        return $roles;
    }

    /**
     * Check if a role is valid
     */
    public static function isValidRole(string $role): bool
    {
        return RoleMiddleware::roleExists($role);
    }
}
