<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Crée le compte administrateur (DG) par défaut s'il n'existe pas encore.
     * Utilise un INSERT ... WHERE NOT EXISTS pour être idempotent.
     */
    public function up(): void
    {
        $email = 'dg@chambrefroide.ci';

        // Si le compte existe déjà, on ne fait rien
        if (DB::table('users')->where('email', $email)->exists()) {
            return;
        }

        DB::table('users')->insert([
            'name'              => 'Directeur Général',
            'email'             => $email,
            'password'          => Hash::make('dg123456'),
            'role'              => 'dg',
            'phone'             => '+225 01 02 03 04 05',
            'is_active'         => true,
            'email_verified_at' => now(), // Pré-vérifié pour éviter le blocage
            'created_at'        => now(),
            'updated_at'        => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('users')->where('email', 'dg@chambrefroide.ci')->delete();
    }
};
