<?php
use App\Http\Controllers\Api\DomisiliController;
use Illuminate\Support\Facades\Route;

// Domisili (KKN Mandiri) routes – placed under /v1/domisili
Route::middleware(['auth:sanctum', 'throttle:60,1'])
    ->prefix('domisili')
    ->name('api.v1.domisili.')
    ->group(function () {
        // POST /v1/domisili  – check or submit domisili data
        Route::post('/', [DomisiliController::class, 'check'])->name('check');

        // GET /v1/domisili/{id}
        Route::get('/{id}', [DomisiliController::class, 'show'])->name('show');
    });
