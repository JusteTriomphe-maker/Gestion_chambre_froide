<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockEntry;
use App\Models\StockExit;
use App\Models\Client;
use App\Models\Supplier;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Middleware\RoleMiddleware;

class DashboardController extends Controller
{
    /**
     * Get dashboard statistics.
     */
    public function stats(Request $request)
    {
        $user = $request->user();
        
        // Check if user has any access to dashboard
        if (!RoleMiddleware::can($user, 'dashboard', 'view')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir le dashboard.'], 403);
        }

        $totalProducts = Product::count();
        $totalClients = Client::count();
        $totalSuppliers = Supplier::count();
        
        $totalStockValue = Product::sum(DB::raw('current_stock * price_buying'));
        $totalPotentialRevenue = Product::sum(DB::raw('current_stock * price_selling'));
        
        // Get debt sums using DB::table to ensure proper numeric return
        $totalDebtFromClients = DB::table('clients')->sum('total_debt') ?: 0;
        $totalDebtToSuppliers = DB::table('suppliers')->sum('total_debt') ?: 0;
        
        // Ensure they are floats
        $totalDebtFromClients = floatval($totalDebtFromClients);
        $totalDebtToSuppliers = floatval($totalDebtToSuppliers);
        
        // Calculate total debts
        $totalDettes = $totalDebtFromClients + $totalDebtToSuppliers;
        
        $totalEntriesToday = StockEntry::whereDate('entry_date', today())->count();
        $totalExitsToday = StockExit::whereDate('exit_date', today())->count();
        
        $lowStockProducts = Product::whereRaw('current_stock < min_threshold')->count();
        
        return response()->json([
            'total_products' => intval($totalProducts),
            'total_clients' => intval($totalClients),
            'total_suppliers' => intval($totalSuppliers),
            'total_stock_value' => floatval($totalStockValue),
            'total_potential_revenue' => floatval($totalPotentialRevenue),
            'total_debt_from_clients' => $totalDebtFromClients,
            'total_debt_to_suppliers' => $totalDebtToSuppliers,
            'total_dettes' => $totalDettes,
            'entries_today' => intval($totalEntriesToday),
            'exits_today' => intval($totalExitsToday),
            'low_stock_products' => intval($lowStockProducts),
        ]);
    }

    /**
     * Get chart data for dashboard.
     */
    public function chartData(Request $request)
    {
        $user = $request->user();
        
        // Check if user has any access to dashboard
        if (!RoleMiddleware::can($user, 'dashboard', 'view')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir le dashboard.'], 403);
        }

        // Get stock entries by month for the last 6 months (PostgreSQL compatible)
        $entriesByMonth = StockEntry::select(
            DB::raw('EXTRACT(MONTH FROM entry_date) as month'),
            DB::raw('SUM(quantity * unit_price) as total')
        )
        ->where('entry_date', '>=', now()->subMonths(6))
        ->groupBy('month')
        ->orderBy('month')
        ->get();

        // Get stock exits by month for the last 6 months (PostgreSQL compatible)
        $exitsByMonth = StockExit::select(
            DB::raw('EXTRACT(MONTH FROM exit_date) as month'),
            DB::raw('SUM(quantity * unit_price) as total')
        )
        ->where('exit_date', '>=', now()->subMonths(6))
        ->groupBy('month')
        ->orderBy('month')
        ->get();

        // Get top products by quantity sold
        $topProducts = StockExit::select('product_id')
            ->selectRaw('SUM(quantity) as total_sold')
            ->with('product:id,name')
            ->groupBy('product_id')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get();

        // Get debt evolution by month (PostgreSQL compatible)
        $debtByMonth = DB::table('debts')
            ->select(
                DB::raw('EXTRACT(MONTH FROM date) as month'),
                DB::raw("SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END) as total")
            )
            ->where('date', '>=', now()->subMonths(6))
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json([
            'entries_by_month' => $entriesByMonth,
            'exits_by_month' => $exitsByMonth,
            'top_products' => $topProducts,
            'debt_by_month' => $debtByMonth,
        ]);
    }

    /**
     * Get expiration alerts for products.
     */
    public function expirationAlerts(Request $request)
    {
        $user = $request->user();
        
        // Check if user has any access to dashboard
        if (!RoleMiddleware::can($user, 'dashboard', 'view')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir le dashboard.'], 403);
        }

        $expiringSoon = StockEntry::with('product:id,name')
            ->whereDate('expiration_date', '<=', now()->addDays(7))
            ->whereDate('expiration_date', '>=', now())
            ->orderBy('expiration_date')
            ->get();

        $expired = StockEntry::with('product:id,name')
            ->whereDate('expiration_date', '<', now())
            ->orderBy('expiration_date')
            ->get();

        return response()->json([
            'expiring_soon' => $expiringSoon,
            'expired' => $expired,
            'expiring_soon_count' => $expiringSoon->count(),
            'expired_count' => $expired->count(),
        ]);
    }

    /**
     * Get today's revenue (Chiffre d'Affaires du jour).
     * Calcul: SUM(sale_items.quantity * sale_items.unit_price) where sales.is_paid = true
     */
    public function todayRevenue(Request $request)
    {
        $user = $request->user();
        
        if (!RoleMiddleware::can($user, 'dashboard', 'view')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir le dashboard.'], 403);
        }

        // Calculate today's revenue from PAID sales only
        // Using Sale::with('items') and filtering by is_paid = true
        $todayRevenue = Sale::where('is_paid', true)
            ->whereDate('sale_date', today())
            ->with('items')
            ->get()
            ->sum(function ($sale) {
                return $sale->items->sum(function ($item) {
                    return $item->quantity * $item->unit_price;
                });
            });

        return response()->json([
            'today_revenue' => $todayRevenue,
            'date' => today()->format('Y-m-d'),
        ]);
    }

    /**
     * Get revenue history grouped by date.
     * Only includes PAID sales.
     * Calcul: SUM(sale_items.quantity * sale_items.unit_price) grouped by DATE(sales.sale_date)
     */
    public function revenueHistory(Request $request)
    {
        $user = $request->user();
        
        if (!RoleMiddleware::can($user, 'dashboard', 'view')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir le dashboard.'], 403);
        }

        $category = $request->get('category');

        // Build the base query for PAID sales
        $salesQuery = Sale::where('is_paid', true)
            ->where('sale_date', '>=', now()->subDays(90));

        // Apply category filter if provided
        if ($category && $category !== 'all') {
            $salesQuery->whereHas('items.product', function ($subQ) use ($category) {
                $subQ->where('category', $category);
            });
        }

        // Get all paid sales with their items
        $sales = $salesQuery->with(['items.product'])->get();

        // Group by date and calculate total from sale_items (quantity * unit_price)
        $history = $sales->groupBy(function ($sale) {
            return $sale->sale_date->format('Y-m-d');
        })->map(function ($daySales, $date) {
            $total = $daySales->sum(function ($sale) {
                return $sale->items->sum(function ($item) {
                    return floatval($item->quantity) * floatval($item->unit_price);
                });
            });
            
            return [
                'date' => $date,
                'total' => $total,
                'transaction_count' => $daySales->count(),
            ];
        })->values()->sortByDesc('date')->take(90)->values();

        return response()->json([
            'history' => $history,
        ]);
    }

    /**
     * Get revenue breakdown by category.
     * Only includes PAID sales.
     */
    public function revenueByCategory(Request $request)
    {
        $user = $request->user();
        
        if (!RoleMiddleware::can($user, 'dashboard', 'view')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir le dashboard.'], 403);
        }

        // Get revenue by category from PAID sales only
        $revenueByCategory = SaleItem::select(
            'products.category',
            DB::raw('SUM(sale_items.quantity * sale_items.unit_price) as total_revenue'),
            DB::raw('SUM(sale_items.quantity) as total_quantity'),
            DB::raw('COUNT(DISTINCT sale_items.sale_id) as transaction_count')
        )
        ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
        ->join('products', 'sale_items.product_id', '=', 'products.id')
        ->where('sales.is_paid', true)
        ->groupBy('products.category')
        ->orderByDesc('total_revenue')
        ->get();

        // Get all unique categories from products
        $categories = Product::distinct()
            ->whereNotNull('category')
            ->where('category', '!=', '')
            ->pluck('category');

        return response()->json([
            'revenue_by_category' => $revenueByCategory,
            'categories' => $categories,
        ]);
    }

    /**
     * Get detailed revenue report with pagination.
     * Only includes PAID sales.
     */
    public function revenueReport(Request $request)
    {
        $user = $request->user();
        
        if (!RoleMiddleware::can($user, 'dashboard', 'view')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir le dashboard.'], 403);
        }

        $category = $request->get('category');
        $perPage = $request->get('per_page', 15);

        // Get PAID sales with items and related data
        $query = Sale::where('is_paid', true)
            ->with(['items.product:id,name,category', 'client:id,name', 'user:id,name'])
            ->withSum('items', DB::raw('quantity * unit_price'));

        // Filter by category if provided
        if ($category && $category !== 'all') {
            $query->whereHas('items.product', function ($q) use ($category) {
                $q->where('category', $category);
            });
        }

        // Filter by date range
        if ($request->has('start_date') && $request->start_date) {
            $query->whereDate('sale_date', '>=', $request->start_date);
        }

        if ($request->has('end_date') && $request->end_date) {
            $query->whereDate('sale_date', '<=', $request->end_date);
        }

        // Sort by most recent
        $query->orderByDesc('sale_date');

        $transactions = $query->paginate($perPage);

        return response()->json($transactions);
    }

    /**
     * Get revenue by specific date.
     * Only includes PAID sales.
     * Returns flattened sale_items for easier frontend consumption.
     */
    public function revenueByDate(Request $request)
    {
        $user = $request->user();
        
        if (!RoleMiddleware::can($user, 'dashboard', 'view')) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas la permission de voir le dashboard.'], 403);
        }

        $date = $request->get('date', today()->format('Y-m-d'));

        // Get PAID sales for the specific date with items
        $sales = Sale::where('is_paid', true)
            ->whereDate('sale_date', $date)
            ->with(['items.product:id,name,category,unit', 'client:id,name', 'user:id,name'])
            ->orderByDesc('created_at')
            ->get();

        // Flatten sale items for frontend - each item becomes a row
        $saleItems = [];
        foreach ($sales as $sale) {
            foreach ($sale->items as $item) {
                $saleItems[] = [
                    'id' => $item->id,
                    'sale_id' => $sale->id,
                    'receipt_number' => $sale->receipt_number,
                    'product_id' => $item->product_id,
                    'product' => $item->product ? [
                        'id' => $item->product->id,
                        'name' => $item->product->name,
                        'category' => $item->product->category,
                        'unit' => $item->product->unit,
                    ] : null,
                    'quantity' => floatval($item->quantity),
                    'unit_price' => floatval($item->unit_price),
                    'subtotal' => floatval($item->quantity) * floatval($item->unit_price),
                    'client' => $sale->client ? [
                        'id' => $sale->client->id,
                        'name' => $sale->client->name,
                    ] : null,
                    'user' => $sale->user ? [
                        'id' => $sale->user->id,
                        'name' => $sale->user->name,
                    ] : null,
                    'created_at' => $sale->created_at->toIso8601String(),
                    'sale_date' => $sale->sale_date->format('Y-m-d'),
                ];
            }
        }

        // Calculate total from sale_items
        $total = array_sum(array_column($saleItems, 'subtotal'));

        return response()->json([
            'date' => $date,
            'sales' => $saleItems,
            'total' => $total,
            'count' => count($saleItems),
            'transaction_count' => $sales->count(),
        ]);
    }
}
