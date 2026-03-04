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
        Schema::create('stock_exits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->decimal('quantity', 10, 2);
            $table->date('exit_date');
            $table->enum('reason', ['vente', 'perte', 'peremption', 'autre']);
            $table->decimal('unit_price', 10, 2);
            $table->boolean('is_paid')->default(false); // Si payé par le client
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_exits');
    }
};
