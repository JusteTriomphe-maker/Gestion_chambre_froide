<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Extension de la table products pour supporter kg + cartons
        Schema::table('products', function (Blueprint $table) {
            // Mode de gestion du stock : kg_only, carton_only, kg_and_carton
            $table->string('stock_mode', 20)
                ->default('kg_only')
                ->after('unit');

            // Poids d'un carton en kg (null si non applicable)
            $table->decimal('kg_per_carton', 10, 2)
                ->nullable()
                ->after('stock_mode');

            // Prix par carton (libre, sans relation imposée avec le prix au kg)
            $table->decimal('price_per_carton', 10, 2)
                ->nullable()
                ->after('price_selling');
        });

        // Ajout d'informations d'unité sur les mouvements de stock
        Schema::table('stock_entries', function (Blueprint $table) {
            // Unité saisie lors de l'entrée : kg ou carton
            $table->string('input_unit', 10)
                ->default('kg')
                ->after('quantity');

            // Quantité saisie (avant conversion en kg)
            $table->decimal('input_quantity', 10, 2)
                ->nullable()
                ->after('input_unit');

            // Taux de conversion utilisé (kg par carton) au moment du mouvement
            $table->decimal('conversion_rate', 10, 4)
                ->nullable()
                ->after('input_quantity');
        });

        Schema::table('stock_exits', function (Blueprint $table) {
            $table->string('input_unit', 10)
                ->default('kg')
                ->after('quantity');

            $table->decimal('input_quantity', 10, 2)
                ->nullable()
                ->after('input_unit');

            $table->decimal('conversion_rate', 10, 4)
                ->nullable()
                ->after('input_quantity');
        });

        Schema::table('sale_items', function (Blueprint $table) {
            // Unité saisie pour la ligne de vente : kg ou carton
            $table->string('input_unit', 10)
                ->default('kg')
                ->after('product_id');

            // Quantité saisie (avant conversion en kg)
            $table->decimal('input_quantity', 10, 2)
                ->nullable()
                ->after('input_unit');

            // Taux de conversion utilisé (kg par carton)
            $table->decimal('conversion_rate', 10, 4)
                ->nullable()
                ->after('input_quantity');
        });

        // Autoriser les quantités décimales (ventes au kg)
        // Note: éviter $table->change() (doctrine/dbal), utiliser SQL direct pour PostgreSQL.
        DB::statement('ALTER TABLE sale_items ALTER COLUMN quantity TYPE numeric(10,2) USING quantity::numeric');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['stock_mode', 'kg_per_carton', 'price_per_carton']);
        });

        Schema::table('stock_entries', function (Blueprint $table) {
            $table->dropColumn(['input_unit', 'input_quantity', 'conversion_rate']);
        });

        Schema::table('stock_exits', function (Blueprint $table) {
            $table->dropColumn(['input_unit', 'input_quantity', 'conversion_rate']);
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropColumn(['input_unit', 'input_quantity', 'conversion_rate']);
        });

        // Revenir à un entier pour quantity
        DB::statement('ALTER TABLE sale_items ALTER COLUMN quantity TYPE integer USING ROUND(quantity)::integer');
    }
};

