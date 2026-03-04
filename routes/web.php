<?php

use App\Http\Controllers\ProfileController;
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
    
    // Application Routes
    Route::get('/products', function () {
        return Inertia::render('Products/Index');
    })->name('products');

    Route::get('/clients', function () {
        return Inertia::render('Clients/Index');
    })->name('clients');

    Route::get('/suppliers', function () {
        return Inertia::render('Suppliers/Index');
    })->name('suppliers');

    Route::get('/stock-entries', function () {
        return Inertia::render('StockEntries/Index');
    })->name('stock-entries');

    Route::get('/stock-exits', function () {
        return Inertia::render('StockExits/Index');
    })->name('stock-exits');

    Route::get('/debts', function () {
        return Inertia::render('Debts/Index');
    })->name('debts');

    Route::get('/users', function () {
        return Inertia::render('Users/Index');
    })->name('users');

    Route::get('/sales', function () {
        return Inertia::render('Sales/Index');
    })->name('sales');

    // Chiffre d'Affaires / Revenue
    Route::get('/chiffre-affaires', function () {
        return Inertia::render('Revenue/Index');
    })->name('revenue');
    
    // Revenue alias route
    Route::get('/revenue', function () {
        return Inertia::render('Revenue/Index');
    })->name('revenue.alias');
});

require __DIR__.'/auth.php';
