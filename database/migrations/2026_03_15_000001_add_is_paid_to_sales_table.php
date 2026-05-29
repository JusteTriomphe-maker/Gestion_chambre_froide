<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Protéger contre les erreurs si les colonnes existent déjà (base déjà partiellement migrée)
        if (!Schema::hasColumn('sales', 'is_paid')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->boolean('is_paid')->default(false)->after('total_amount');
            });
        }

        if (!Schema::hasColumn('sales', 'paid_at')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->timestamp('paid_at')->nullable()->after('is_paid');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('sales', 'paid_at')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->dropColumn('paid_at');
            });
        }

        if (Schema::hasColumn('sales', 'is_paid')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->dropColumn('is_paid');
            });
        }
    }
};
