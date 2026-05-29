<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Protéger contre les erreurs si la colonne existe déjà (base déjà partiellement migrée)
        if (!Schema::hasColumn('stock_exits', 'user_id')) {
            Schema::table('stock_exits', function (Blueprint $table) {
                $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('stock_exits', 'user_id')) {
            Schema::table('stock_exits', function (Blueprint $table) {
                $table->dropForeign(['user_id']);
                $table->dropColumn('user_id');
            });
        }
    }
};
