<?php


use App\Http\Controllers\InventoryController;
use App\Http\Middleware\AuthMiddleware;
use Illuminate\Support\Facades\Route;


$app_name = env('APP_NAME', '');

Route::redirect('/', "/$app_name");

Route::prefix($app_name)->middleware(AuthMiddleware::class)->group(function () {
    // ── Inventory ──────────────────────────────────────────────────────────────
    Route::prefix('inventory')->name('inventory.')->group(function () {
        // Inertia page
        Route::get('/',             [InventoryController::class, 'index'])->name('index');

        // JSON API — data, stats, CRUD, bulk ops
        Route::get('/data',         [InventoryController::class, 'data'])->name('data');
        Route::get('/stats',        [InventoryController::class, 'stats'])->name('stats');
        Route::post('/',            [InventoryController::class, 'store'])->name('store');
        Route::put('/{id}',         [InventoryController::class, 'update'])->name('update');
        Route::delete('/bulk',      [InventoryController::class, 'bulkDelete'])->name('bulkDelete');
        Route::delete('/{id}',      [InventoryController::class, 'destroy'])->name('destroy');
        Route::post('/bulk-upload', [InventoryController::class, 'bulkUpload'])->name('bulkUpload');
    });
});
