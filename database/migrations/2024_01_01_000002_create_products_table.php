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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('barcode')->unique()->nullable();
            $table->string('category')->nullable();
            $table->decimal('price_buying', 10, 2);
            $table->decimal('price_selling', 10, 2);
            $table->string('unit'); // kg, litre, unité
            $table->decimal('min_threshold', 10, 2)->default(0);
            $table->decimal('current_stock', 10, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
