<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     * 
     * SECURITY: Public registration is disabled by default.
     * Only the DG can create users through the admin panel.
     */
    public function create(): Response
    {
        // Redirect to login with error message
        // Public registration is disabled for security
        return Inertia::render('Auth/Register', [
            'registration_disabled' => true,
            'message' => 'L\'inscription publique est désactivée. Veuillez contacter l\'administrateur pour créer un compte.'
        ]);
    }

    /**
     * Handle an incoming registration request.
     * 
     * SECURITY: This method is disabled by default.
     * Only users created by DG through admin panel are allowed.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        // SECURITY: Disable public registration
        // All user creation must go through the admin panel by DG
        return redirect()->route('login')->with('error', 
            'L\'inscription publique est désactivée. Veuillez contacter l\'administrateur pour créer un compte.'
        );
    }

    /**
     * Handle API registration request (if needed for internal use only).
     * This should only be called by authenticated DG.
     */
    public function apiStore(Request $request): RedirectResponse
    {
        // Only allow this if the request comes from an authenticated DG
        $authenticatedUser = $request->user();
        
        if (!$authenticatedUser || !$authenticatedUser->isDG()) {
            abort(403, 'Seul le Directeur Général peut créer des utilisateurs.');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => ['required', 'string', 'in:dg,gerant,caissier,magasinier,comptable'],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'is_active' => true,
        ]);

        event(new Registered($user));

        return redirect()->route('users.index')->with('success', 
            'Utilisateur créé avec succès.'
        );
    }
}
