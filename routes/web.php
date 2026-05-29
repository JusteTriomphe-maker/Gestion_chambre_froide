<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Api\SaleController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    // Application Routes avec contrôle d'accès par rôle
    // Products - Accès: DG, Gérant
    Route::get('/products', function () {
        return Inertia::render('Products/Index');
    })->name('products')->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':products');

    // Clients - Accès: DG, Caissier
    Route::get('/clients', function () {
        return Inertia::render('Clients/Index');
    })->name('clients')->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':clients');

    // Suppliers - Accès: DG uniquement
    Route::get('/suppliers', function () {
        return Inertia::render('Suppliers/Index');
    })->name('suppliers')->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':suppliers');

    // Stock Entries - Accès: DG, Gérant
    Route::get('/stock-entries', function () {
        return Inertia::render('StockEntries/Index');
    })->name('stock-entries')->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':stock-entries');

    // Stock Exits - Accès: DG, Gérant, Caissier
    Route::get('/stock-exits', function () {
        return Inertia::render('StockExits/Index');
    })->name('stock-exits')->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':stock-exits');

    // Debts - Accès: DG, Comptable
    Route::get('/debts', function () {
        return Inertia::render('Debts/Index');
    })->name('debts')->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':debts');

    // Users - Accès: DG uniquement
    Route::get('/users', function () {
        return Inertia::render('Users/Index');
    })->name('users')->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':users');

    // Sales - Accès: DG, Caissier
    Route::get('/sales', function () {
        return Inertia::render('Sales/Index');
    })->name('sales')->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':sales');

    // Rapport PDF des ventes du jour - Accès: DG, Gérant (contrôle dans le contrôleur)
    Route::get('/sales/daily-report', [SaleController::class, 'generateDailyReport'])
        ->name('sales.daily-report');

    // Chiffre d'Affaires / Revenue - Accès: DG, Comptable
    Route::get('/chiffre-affaires', function () {
        return Inertia::render('Revenue/Index');
    })->name('revenue')->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':revenue');
    
    // Revenue alias route - Accès: DG, Comptable
    Route::get('/revenue', function () {
        return Inertia::render('Revenue/Index');
    })->name('revenue.alias')->middleware(\App\Http\Middleware\RoleAccessMiddleware::class.':revenue');
});

require __DIR__.'/auth.php';
