<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Modifier la contrainte CHECK pour supprimer 'magasinier'
        DB::statement("ALTER TABLE users DROP CONSTRAINT users_role_check");
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('dg', 'gerant', 'caissier', 'comptable'))");
    }

    public function down(): void
    {
        // Revenir à l'ancienne contrainte avec 'magasinier'
        DB::statement("ALTER TABLE users DROP CONSTRAINT users_role_check");
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('dg', 'gerant', 'caissier', 'magasinier', 'comptable'))");
    }
};
