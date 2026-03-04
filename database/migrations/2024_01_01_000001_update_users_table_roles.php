<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Supprimer l'ancienne colonne role
            $table->dropColumn('role');
        });

        Schema::table('users', function (Blueprint $table) {
            // Nouveau rôle avec plus d'options
            $table->enum('role', [
                'dg',        // Directeur Général - Accès total
                'gerant',    // Gérant - Gestion quotidienne
                'caissier',  // Caissier - Sorties stock + Clients
                'comptable'  // Comptable - Dashboard + Dettes
            ])->default('gerant')->after('email');
            
            // Informations supplémentaires
            $table->string('phone')->nullable()->after('role');
            $table->text('permissions')->nullable()->after('phone');
            $table->boolean('is_active')->default(true)->after('permissions');
            $table->timestamp('last_login')->nullable()->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'phone', 'permissions', 'is_active', 'last_login']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'gerant'])->default('gerant');
        });
    }
};
