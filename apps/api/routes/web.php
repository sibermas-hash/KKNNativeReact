<?php

use App\Http\Controllers\HealthController;
use Illuminate\Support\Facades\Route;

// Named 'login' route required by Laravel's auth redirector (redirectGuestsTo).
// Returns JSON 401 — this is a headless API, no HTML login page exists here.
Route::get('/login', function () {
    return response()->json([
        'success' => false,
        'error' => ['code' => 'UNAUTHORIZED', 'message' => 'Silakan login terlebih dahulu.'],
    ], 401);
})->name('login');

// Health Check — public (load balancers)
Route::get('/health', [HealthController::class, 'check'])->name('health');

// Detailed health — restricted to internal/admin use
Route::get('/health/detailed', [HealthController::class, 'detailed'])
    ->middleware('auth:sanctum')
    ->name('health.detailed');

// Catch-all: redirect to Next.js frontend (strip host to prevent open redirect)
Route::fallback(function () {
    $path = '/' . ltrim(request()->path(), '/');
    $query = request()->getQueryString();
    return redirect(config('app.url') . $path . ($query ? '?' . $query : ''), 302);
});
