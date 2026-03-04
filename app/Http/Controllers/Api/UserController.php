<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use App\Http\Middleware\RoleMiddleware;

class UserController extends Controller
{
    /**
     * Liste des rôles sensibles qui ne peuvent être attribués que par le DG
     */
    private const RESTRICTED_ROLES = ['dg'];

    /**
     * Liste des rôles disponibles pour création (DG exclus pour les non-DG)
     */
    private const AVAILABLE_ROLES_FOR_NON_DG = ['gerant', 'caissier', 'comptable'];
    private const ALL_ROLES = ['dg', 'gerant', 'caissier', 'comptable'];

    public function index(Request $request)
    {
        $user = $request->user();
        
        // Only DG can view all users
        if (!RoleMiddleware::can($user, 'users', 'view')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir les utilisateurs.'], 403);
        }

        $users = User::orderBy('created_at', 'desc')->get();
        
        // Hide sensitive data
        $users->makeHidden(['password', 'remember_token']);
        
        return response()->json([
            'data' => $users
        ]);
    }

    public function store(Request $request)
    {
        $currentUser = $request->user();
        
        // SECURITY: Only DG can create users
        if (!RoleMiddleware::can($currentUser, 'users', 'create')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de créer des utilisateurs.'], 403);
        }

        // SECURITY: Only DG can create users with DG role
        $availableRoles = $currentUser->isDG() 
            ? self::ALL_ROLES 
            : self::AVAILABLE_ROLES_FOR_NON_DG;

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'role' => ['required', 'string', 'in:' . implode(',', $availableRoles)],
            'phone' => ['nullable', 'string', 'max:20'],
        ]);

        $newUser = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'phone' => $validated['phone'] ?? null,
            'is_active' => true, // New users are active by default
        ]);

        // Don't return password or sensitive data
        $newUser->makeHidden(['password', 'remember_token']);

        return response()->json([
            'data' => $newUser,
            'message' => 'Utilisateur créé avec succès'
        ], 201);
    }

    public function show(Request $request, User $user)
    {
        $currentUser = $request->user();
        
        // Users can view their own profile, DG can view all
        if (!RoleMiddleware::can($currentUser, 'users', 'view') && $currentUser->id !== $user->id) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir cet utilisateur.'], 403);
        }

        $user->makeHidden(['password', 'remember_token']);
        return response()->json([
            'data' => $user
        ]);
    }

    public function update(Request $request, User $user)
    {
        $currentUser = $request->user();
        
        // Check if user can edit
        $canEdit = RoleMiddleware::can($currentUser, 'users', 'edit');
        $isOwnProfile = $currentUser->id === $user->id;
        
        // Users can update their own profile (name, phone, password only - NOT role)
        if ($isOwnProfile && !$canEdit) {
            $validated = $request->validate([
                'name' => ['sometimes', 'string', 'max:255'],
                'email' => ['sometimes', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
                'password' => ['nullable', 'confirmed', Password::defaults()],
                'phone' => ['nullable', 'string', 'max:20'],
            ]);

            $user->update([
                'name' => $validated['name'] ?? $user->name,
                'email' => $validated['email'] ?? $user->email,
                'phone' => $validated['phone'] ?? $user->phone,
            ]);

            if (!empty($validated['password'])) {
                $user->update([
                    'password' => Hash::make($validated['password'])
                ]);
            }

            $user->makeHidden(['password', 'remember_token']);

            return response()->json([
                'data' => $user,
                'message' => 'Profil mis à jour avec succès'
            ]);
        }
        
        if (!$canEdit) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de modifier des utilisateurs.'], 403);
        }

        // SECURITY: Only DG can change roles
        // Determine available roles based on current user's role
        $availableRoles = $currentUser->isDG() 
            ? self::ALL_ROLES 
            : self::AVAILABLE_ROLES_FOR_NON_DG;

        // If trying to change to a restricted role, check if current user is DG
        if ($request->has('role')) {
            if (in_array($request->role, self::RESTRICTED_ROLES) && !$currentUser->isDG()) {
                return response()->json([
                    'message' => 'Seul le Directeur Général peut attribuer ce rôle.'
                ], 403);
            }
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'password' => ['nullable', 'confirmed', Password::defaults()],
            'role' => ['required', 'string', 'in:' . implode(',', $availableRoles)],
            'phone' => ['nullable', 'string', 'max:20'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'phone' => $validated['phone'] ?? $user->phone,
            'is_active' => $validated['is_active'] ?? $user->is_active,
        ]);

        if (!empty($validated['password'])) {
            $user->update([
                'password' => Hash::make($validated['password'])
            ]);
        }

        $user->makeHidden(['password', 'remember_token']);

        return response()->json([
            'data' => $user,
            'message' => 'Utilisateur mis à jour avec succès'
        ]);
    }

    public function destroy(Request $request, User $user)
    {
        $currentUser = $request->user();
        
        // Only DG can delete users
        if (!RoleMiddleware::can($currentUser, 'users', 'delete')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de supprimer des utilisateurs.'], 403);
        }

        // Prevent self-deletion
        if ($currentUser->id === $user->id) {
            return response()->json(['message' => 'Vous ne pouvez pas supprimer votre propre compte.'], 422);
        }

        // Prevent deletion of DG account
        if ($user->role === 'dg') {
            return response()->json(['message' => 'Vous ne pouvez pas supprimer le compte du Directeur Général.'], 422);
        }

        $user->delete();

        return response()->json([
            'message' => 'Utilisateur supprimé avec succès'
        ]);
    }

    /**
     * Toggle user active status (enable/disable)
     */
    public function toggleStatus(Request $request, User $user)
    {
        $currentUser = $request->user();
        
        // Only DG can toggle user status
        if (!$currentUser->isDG()) {
            return response()->json(['message' => 'Seul le Directeur Général peut activer ou désactiver un compte.'], 403);
        }

        // Prevent disabling own account
        if ($currentUser->id === $user->id) {
            return response()->json(['message' => 'Vous ne pouvez pas désactiver votre propre compte.'], 422);
        }

        // Prevent disabling DG account
        if ($user->role === 'dg') {
            return response()->json(['message' => 'Vous ne pouvez pas désactiver le compte du Directeur Général.'], 422);
        }

        $user->update([
            'is_active' => !$user->is_active
        ]);

        $status = $user->is_active ? 'activé' : 'désactivé';

        return response()->json([
            'data' => $user,
            'message' => "Compte $status avec succès"
        ]);
    }
}
