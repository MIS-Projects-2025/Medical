<?php

use App\Http\Controllers\IssuanceController;
use App\Http\Middleware\AuthMiddleware;
use Illuminate\Support\Facades\Route;


$app_name = env('APP_NAME', '');

Route::prefix($app_name)->middleware(AuthMiddleware::class)->group(function () {
    // ── Issuance ───────────────────────────────────────────────────────────────
    Route::prefix('issuance')->name('issuance.')->group(function () {
        // Inertia pages
        Route::get('/',               [IssuanceController::class, 'index'])->name('index');
        Route::get('/records',        [IssuanceController::class, 'records'])->name('records');

        // JSON API — employee search, available items, record issuance, records list
        Route::get('/employees',      [IssuanceController::class, 'searchEmployees'])->name('employees');
        Route::get('/items',          [IssuanceController::class, 'items'])->name('items');
        Route::get('/records/data',   [IssuanceController::class, 'recordsData'])->name('records.data');
        Route::post('/',              [IssuanceController::class, 'store'])->name('store');
    });
});
