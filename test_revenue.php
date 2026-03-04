<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Support\Facades\DB;

echo "=== Test du calcul du chiffre d'affaires ===\n\n";

// Get test data
$user = User::find(10);
$product = Product::find(7);

if (!$user || !$product) {
    echo "Erreur: Utilisateur ou produit non trouvé\n";
    exit(1);
}

echo "User: {$user->name} (ID: {$user->id})\n";
echo "Product: {$product->name} (Stock: {$product->current_stock})\n\n";

// Reset product stock
$product->current_stock = 100;
$product->save();

// Create sale with is_paid = true (PAID)
$salePaid = Sale::create([
    'sale_date' => now()->toDateString(),
    'total_amount' => 5000,
    'user_id' => $user->id,
    'receipt_number' => 'PAID-' . now()->format('YmdHis'),
    'is_paid' => true,
    'paid_at' => now(),
]);

SaleItem::create([
    'sale_id' => $salePaid->id,
    'product_id' => $product->id,
    'quantity' => 10,
    'unit_price' => 500,
    'subtotal' => 5000,
]);

$product->current_stock = 90;
$product->save();

echo "Vente PAYÉE créée (ID: {$salePaid->id})\n";
echo "  - is_paid: " . ($salePaid->is_paid ? 'true' : 'false') . "\n";
echo "  - Montant: 5000\n\n";

// Create sale with is_paid = false (NOT PAID)
$saleUnpaid = Sale::create([
    'sale_date' => now()->toDateString(),
    'total_amount' => 3000,
    'user_id' => $user->id,
    'receipt_number' => 'UNPAID-' . now()->format('YmdHis'),
    'is_paid' => false,
    'paid_at' => null,
]);

SaleItem::create([
    'sale_id' => $saleUnpaid->id,
    'product_id' => $product->id,
    'quantity' => 6,
    'unit_price' => 500,
    'subtotal' => 3000,
]);

$product->current_stock = 84;
$product->save();

echo "Vente NON PAYÉE créée (ID: {$saleUnpaid->id})\n";
echo "  - is_paid: " . ($saleUnpaid->is_paid ? 'true' : 'false') . "\n";
echo "  - Montant: 3000\n\n";

// Test DashboardController revenue calculation
echo "=== Test du calcul du CA (ventes payées uniquement) ===\n\n";

// Method 1: Using Sale::with('items')
$todayRevenue = Sale::where('is_paid', true)
    ->whereDate('sale_date', today())
    ->with('items')
    ->get()
    ->sum(function ($sale) {
        return $sale->items->sum(function ($item) {
            return $item->quantity * $item->unit_price;
        });
    });

echo "Méthode Sale::with('items') avec is_paid=true:\n";
echo "  CA du jour (ventes payées): {$todayRevenue} XOF\n";
echo "  (Attendu: 5000 XOF - seulement la vente payée)\n\n";

// Method 2: All sales (without filter)
$allRevenue = Sale::whereDate('sale_date', today())
    ->with('items')
    ->get()
    ->sum(function ($sale) {
        return $sale->items->sum(function ($item) {
            return $item->quantity * $item->unit_price;
        });
    });

echo "Méthode Sale::with('items') SANS filtre is_paid:\n";
echo "  Total toutes ventes: {$allRevenue} XOF\n";
echo "  (Attendu: 8000 XOF - toutes les ventes)\n\n";

// Test revenue history
$history = Sale::where('is_paid', true)
    ->where('sale_date', '>=', now()->subDays(90))
    ->select(
        'sale_date as date',
        DB::raw('(SELECT SUM(si.quantity * si.unit_price) FROM sale_items si WHERE si.sale_id = sales.id) as total')
    )
    ->groupBy('sale_date')
    ->orderByDesc('sale_date')
    ->get();

echo "Historique des revenus (ventes payées):\n";
foreach ($history as $h) {
    echo "  {$h->date}: {$h->total} XOF\n";
}

echo "\n=== Test terminé avec succès! ===\n";
