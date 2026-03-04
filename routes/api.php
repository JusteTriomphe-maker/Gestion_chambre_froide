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
Route::middleware(['api', 'auth:sanctum'])->group(function () {
    
    // Permissions API
    Route::prefix('permissions')->group(function () {
        Route::get('/current', [PermissionController::class, 'current']);
        Route::get('/roles', [PermissionController::class, 'roles']);
        Route::get('/matrix', [PermissionController::class, 'matrix']);
        Route::post('/check', [PermissionController::class, 'check']);
    });
    
    // Dashboard API
    Route::prefix('dashboard')->group(function () {
        Route::get('/stats', [DashboardController::class, 'stats']);
        Route::get('/chart-data', [DashboardController::class, 'chartData']);
        Route::get('/expiration-alerts', [DashboardController::class, 'expirationAlerts']);
        // Chiffre d'Affaires
        Route::get('/today-revenue', [DashboardController::class, 'todayRevenue']);
        Route::get('/revenue-history', [DashboardController::class, 'revenueHistory']);
        Route::get('/revenue-by-category', [DashboardController::class, 'revenueByCategory']);
        Route::get('/revenue-report', [DashboardController::class, 'revenueReport']);
    });
    
    // Revenue API (alias for CA)
    Route::prefix('revenue')->group(function () {
        Route::get('/history', [DashboardController::class, 'revenueHistory']);
        Route::get('/by-date', [DashboardController::class, 'revenueByDate']);
    });
    
    // Products API
    Route::prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'index']);
        Route::post('/', [ProductController::class, 'store']);
        Route::get('/{product}', [ProductController::class, 'show']);
        Route::put('/{product}', [ProductController::class, 'update']);
        Route::delete('/{product}', [ProductController::class, 'destroy']);
        Route::get('/{product}/stock-history', [ProductController::class, 'stockHistory']);
        Route::get('/low-stock', [ProductController::class, 'lowStock']);
    });
    
    // Suppliers API
    Route::prefix('suppliers')->group(function () {
        Route::get('/', [SupplierController::class, 'index']);
        Route::post('/', [SupplierController::class, 'store']);
        Route::get('/{supplier}', [SupplierController::class, 'show']);
        Route::put('/{supplier}', [SupplierController::class, 'update']);
        Route::delete('/{supplier}', [SupplierController::class, 'destroy']);
        Route::get('/{supplier}/debts', [SupplierController::class, 'debts']);
        Route::post('/{supplier}/pay', [SupplierController::class, 'payDebt']);
    });
    
    // Clients API
    Route::prefix('clients')->group(function () {
        Route::get('/', [ClientController::class, 'index']);
        Route::post('/', [ClientController::class, 'store']);
        Route::get('/{client}', [ClientController::class, 'show']);
        Route::put('/{client}', [ClientController::class, 'update']);
        Route::delete('/{client}', [ClientController::class, 'destroy']);
        Route::get('/{client}/debts', [ClientController::class, 'debts']);
        Route::post('/{client}/pay', [ClientController::class, 'payDebt']);
    });
    
    // Stock Entries API
    Route::prefix('stock-entries')->group(function () {
        Route::get('/', [StockEntryController::class, 'index']);
        Route::post('/', [StockEntryController::class, 'store']);
        Route::get('/{stockEntry}', [StockEntryController::class, 'show']);
        Route::put('/{stockEntry}', [StockEntryController::class, 'update']);
        Route::delete('/{stockEntry}', [StockEntryController::class, 'destroy']);
        Route::get('/pending', [StockEntryController::class, 'pending']);
    });
    
    // Stock Exits API
    Route::prefix('stock-exits')->group(function () {
        Route::get('/', [StockExitController::class, 'index']);
        Route::post('/', [StockExitController::class, 'store']);
        Route::get('/{stockExit}', [StockExitController::class, 'show']);
        Route::put('/{stockExit}', [StockExitController::class, 'update']);
        Route::delete('/{stockExit}', [StockExitController::class, 'destroy']);
        Route::get('/pending', [StockExitController::class, 'pending']);
    });
    
    // Debts API
    Route::prefix('debts')->group(function () {
        Route::get('/', [DebtController::class, 'index']);
        Route::post('/', [DebtController::class, 'store']);
        Route::get('/{debt}', [DebtController::class, 'show']);
        Route::put('/{debt}', [DebtController::class, 'update']);
        Route::delete('/{debt}', [DebtController::class, 'destroy']);
        Route::get('/summary', [DebtController::class, 'summary']);
        Route::post('/{debt}/pay', [DebtController::class, 'pay']);
    });
    
    // Sales API - Gestion des ventes et recus
    Route::prefix('sales')->group(function () {
        Route::get('/', [SaleController::class, 'index']);
        Route::post('/', [SaleController::class, 'store']);
        Route::get('/daily-summary', [SaleController::class, 'dailySummary']);
        Route::get('/report', [SaleController::class, 'report']);
        Route::get('/{sale}', [SaleController::class, 'show']);
        Route::delete('/{sale}', [SaleController::class, 'destroy']);
    });
    
    // Users API
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store']);
        Route::get('/{user}', [UserController::class, 'show']);
        Route::put('/{user}', [UserController::class, 'update']);
        Route::delete('/{user}', [UserController::class, 'destroy']);
        Route::post('/{user}/toggle-status', [UserController::class, 'toggleStatus']);
    });
});
