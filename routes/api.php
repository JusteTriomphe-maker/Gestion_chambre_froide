<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\StockEntryController;
use App\Http\Controllers\Api\StockExitController;
use App\Http\Controllers\Api\DebtController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\SaleController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Protected Routes
Route::middleware(['api', 'auth'])->group(function () {
    
    // Permissions API - Accessible à tous les utilisateurs connectés
    Route::prefix('permissions')->group(function () {
        Route::get('/current', [PermissionController::class, 'current']);
        Route::get('/roles', [PermissionController::class, 'roles']);
        Route::get('/matrix', [PermissionController::class, 'matrix']);
        Route::post('/check', [PermissionController::class, 'check']);
    });
    
    // Dashboard API - Accessible à tous les rôles
    Route::prefix('dashboard')->group(function () {
        Route::get('/stats', [DashboardController::class, 'stats']);
        Route::get('/chart-data', [DashboardController::class, 'chartData']);
        Route::get('/expiration-alerts', [DashboardController::class, 'expirationAlerts']);
        // Chiffre d'Affaires - Accès: DG, Comptable
        Route::get('/today-revenue', [DashboardController::class, 'todayRevenue'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':revenue');
        Route::get('/revenue-history', [DashboardController::class, 'revenueHistory'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':revenue');
        Route::get('/revenue-by-category', [DashboardController::class, 'revenueByCategory'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':revenue');
        Route::get('/revenue-report', [DashboardController::class, 'revenueReport'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':revenue');
    });
    
    // Revenue API (alias for CA) - Accès: DG, Comptable
    Route::prefix('revenue')->group(function () {
        Route::get('/history', [DashboardController::class, 'revenueHistory'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':revenue');
        Route::get('/by-date', [DashboardController::class, 'revenueByDate'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':revenue');
    });
    
    // Products API - Accès: DG, Gérant
    Route::prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'index'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':products');
        Route::post('/', [ProductController::class, 'store'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':products');
        Route::get('/{product}', [ProductController::class, 'show'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':products');
        Route::put('/{product}', [ProductController::class, 'update'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':products');
        Route::delete('/{product}', [ProductController::class, 'destroy'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':products');
        Route::get('/{product}/stock-history', [ProductController::class, 'stockHistory'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':products');
        Route::get('/low-stock', [ProductController::class, 'lowStock'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':products');
    });
    
    // Suppliers API - Accès: DG uniquement
    Route::prefix('suppliers')->group(function () {
        Route::get('/', [SupplierController::class, 'index'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':suppliers');
        Route::post('/', [SupplierController::class, 'store'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':suppliers');
        Route::get('/{supplier}', [SupplierController::class, 'show'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':suppliers');
        Route::put('/{supplier}', [SupplierController::class, 'update'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':suppliers');
        Route::delete('/{supplier}', [SupplierController::class, 'destroy'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':suppliers');
        Route::get('/{supplier}/debts', [SupplierController::class, 'debts'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':suppliers');
        Route::post('/{supplier}/pay', [SupplierController::class, 'payDebt'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':suppliers');
    });
    
    // Clients API - Accès: DG, Caissier
    Route::prefix('clients')->group(function () {
        Route::get('/', [ClientController::class, 'index'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':clients');
        Route::post('/', [ClientController::class, 'store'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':clients');
        Route::get('/{client}', [ClientController::class, 'show'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':clients');
        Route::put('/{client}', [ClientController::class, 'update'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':clients');
        Route::delete('/{client}', [ClientController::class, 'destroy'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':clients');
        Route::get('/{client}/debts', [ClientController::class, 'debts'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':clients');
        Route::post('/{client}/pay', [ClientController::class, 'payDebt'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':clients');
    });
    
    // Stock Entries API - Accès: DG, Gérant
    Route::prefix('stock-entries')->group(function () {
        Route::get('/', [StockEntryController::class, 'index'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':stock-entries');
        Route::post('/', [StockEntryController::class, 'store'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':stock-entries');
        Route::get('/{stockEntry}', [StockEntryController::class, 'show'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':stock-entries');
        Route::put('/{stockEntry}', [StockEntryController::class, 'update'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':stock-entries');
        Route::delete('/{stockEntry}', [StockEntryController::class, 'destroy'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':stock-entries');
        Route::get('/pending', [StockEntryController::class, 'pending'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':stock-entries');
    });
    
    // Stock Exits API - Accès: DG, Gérant, Caissier
    Route::prefix('stock-exits')->group(function () {
        Route::get('/', [StockExitController::class, 'index'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':stock-exits');
        Route::post('/', [StockExitController::class, 'store'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':stock-exits');
        Route::get('/{stockExit}', [StockExitController::class, 'show'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':stock-exits');
        Route::put('/{stockExit}', [StockExitController::class, 'update'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':stock-exits');
        Route::delete('/{stockExit}', [StockExitController::class, 'destroy'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':stock-exits');
        Route::get('/pending', [StockExitController::class, 'pending'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':stock-exits');
    });
    
    // Debts API - Accès: DG, Comptable
    Route::prefix('debts')->group(function () {
        Route::get('/', [DebtController::class, 'index'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':debts');
        Route::post('/', [DebtController::class, 'store'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':debts');
        Route::get('/{debt}', [DebtController::class, 'show'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':debts');
        Route::put('/{debt}', [DebtController::class, 'update'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':debts');
        Route::delete('/{debt}', [DebtController::class, 'destroy'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':debts');
        Route::get('/summary', [DebtController::class, 'summary'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':debts');
        Route::post('/{debt}/pay', [DebtController::class, 'pay'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':debts');
    });
    
    // Sales API - Gestion des ventes et recus - Accès: DG, Caissier
    Route::prefix('sales')->group(function () {
        Route::get('/', [SaleController::class, 'index'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':sales');
        Route::post('/', [SaleController::class, 'store'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':sales');
        Route::get('/daily-summary', [SaleController::class, 'dailySummary'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':sales');
        Route::get('/report', [SaleController::class, 'report'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':sales');
        Route::get('/{sale}', [SaleController::class, 'show'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':sales');
        Route::delete('/{sale}', [SaleController::class, 'destroy'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':sales');
    });
    
    // Users API - Accès: DG uniquement
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':users');
        Route::post('/', [UserController::class, 'store'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':users');
        Route::get('/{user}', [UserController::class, 'show'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':users');
        Route::put('/{user}', [UserController::class, 'update'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':users');
        Route::delete('/{user}', [UserController::class, 'destroy'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':users');
        Route::post('/{user}/toggle-status', [UserController::class, 'toggleStatus'])
            ->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':users');
    });
});
