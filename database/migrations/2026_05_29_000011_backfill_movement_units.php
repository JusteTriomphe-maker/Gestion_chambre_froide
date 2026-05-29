<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Anciennes lignes : quantité = kg, unité saisie = kg
        DB::table('stock_entries')
            ->whereNull('input_quantity')
            ->update([
                'input_unit' => 'kg',
                'input_quantity' => DB::raw('quantity'),
            ]);

        DB::table('stock_exits')
            ->whereNull('input_quantity')
            ->update([
                'input_unit' => 'kg',
                'input_quantity' => DB::raw('quantity'),
            ]);

        DB::table('sale_items')
            ->whereNull('input_quantity')
            ->update([
                'input_unit' => 'kg',
                'input_quantity' => DB::raw('quantity'),
            ]);
    }

    public function down(): void
    {
        // Pas de rollback destructif
    }
};
