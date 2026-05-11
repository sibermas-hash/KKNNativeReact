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

// Password reset link — redirects to Next.js frontend with token
Route::get('/password/reset/{token}', function (string $token) {
    $frontendUrl = config('app.frontend_url', config('app.url'));
    $email = request()->query('email');

    return redirect($frontendUrl.'/atur-ulang-kata-sandi?token='.$token.($email ? '&email='.urlencode($email) : ''));
})->name('password.reset');

// Health Check — public (load balancers)
Route::get('/health', [HealthController::class, 'check'])->name('health');

// Readiness Check — public (Kubernetes/Docker probes)
Route::get('/ready', [HealthController::class, 'ready'])->name('ready');

// Detailed health — superadmin only. Leaks internal telemetry (Redis version,
// external API URL, queue depth, DB table count) so it must not be accessible
// to ordinary authenticated users (audit M-006).
Route::get('/health/detailed', [HealthController::class, 'detailed'])
    ->middleware(['auth:sanctum', 'role:superadmin'])
    ->name('health.detailed');

// Catch-all: return JSON 404 for API paths, redirect to Next.js frontend for everything else.
Route::fallback(function () {
    $request = request();

    if ($request->is('api/*') || $request->expectsJson()) {
        return response()->json([
            'success' => false,
            'error' => [
                'code' => 'NOT_FOUND',
                'message' => 'Endpoint tidak ditemukan.',
            ],
        ], 404);
    }

    $path = '/'.ltrim($request->path(), '/');
    $query = $request->getQueryString();

    return redirect(config('app.url').$path.($query ? '?'.$query : ''), 302);
});
