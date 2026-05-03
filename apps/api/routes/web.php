<?php

use App\Http\Controllers\HealthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Only public routes that serve HTML or health checks remain here.
| All auth, student, DPL, and admin routes are handled by the API.
| Next.js handles all page rendering.
|
*/

// Health Check Endpoint (used by load balancers and monitoring)
Route::get('/health', [HealthController::class, 'check'])->name('health');
Route::get('/health/detailed', [HealthController::class, 'detailed'])->name('health.detailed');

// Catch-all: redirect any non-API, non-health web requests to Next.js
// This handles old bookmarks during the transition period
Route::fallback(function () {
    return redirect(config('app.url') . request()->getRequestUri(), 302);
});
