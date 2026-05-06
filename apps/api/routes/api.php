<?php

use App\Http\Controllers\Api\AdminKeyController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PublicDataController;
use App\Http\Controllers\Api\RegistrationController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\PeriodContextController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\PublicController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;

/*
 |--------------------------------------------------------------------------
 | API Routes
 |--------------------------------------------------------------------------
 |
 | Here is where you can register API routes for your application. These
 | routes are loaded by the RouteServiceProvider and all of them will
 | be assigned to the "api" middleware group. Make something great!
 |
 */

// ── Health Checks ─────────────────────────────────────────────────────────
// Monitoring, load balancer, and Kubernetes probes. No auth required.

Route::get('/health', [HealthController::class, 'check'])->name('api.health');
Route::get('/ready', [HealthController::class, 'ready'])->name('api.ready');

// ── V1 API ────────────────────────────────────────────────────────────────
// New JSON API for Next.js SPA and React Native mobile app.

Route::prefix('v1')->group(function () {
    // Public endpoints — no auth required
    Route::prefix('public')->middleware('throttle:60,1')->group(function () {
        Route::get('/home', [PublicController::class, 'home'])->name('api.v1.public.home');
        Route::get('/announcements', [PublicController::class, 'announcements'])->name('api.v1.public.announcements');
        Route::get('/announcements/{slug}', [PublicController::class, 'announcementBySlug'])->name('api.v1.public.announcements.show');
        Route::get('/locations', [PublicController::class, 'locations'])->name('api.v1.public.locations');
        Route::get('/downloads', [PublicController::class, 'downloads'])->name('api.v1.public.downloads');
        Route::get('/verify-certificate/{token}', [PublicController::class, 'verifyCertificate'])->name('api.v1.public.verify-certificate');
    });

    // Auth — public
    Route::prefix('auth')->group(function () {
        Route::get('/captcha', [AuthController::class, 'captcha'])
            ->middleware('throttle:10,1')
            ->name('api.v1.auth.captcha');

        Route::post('/login', [AuthController::class, 'login'])
            ->middleware('throttle:10,1')
            ->name('api.v1.auth.login');

        Route::post('/logout', [AuthController::class, 'logout'])
            ->middleware('auth:sanctum')
            ->name('api.v1.auth.logout');

        Route::get('/user', [AuthController::class, 'user'])
            ->middleware('auth:sanctum')
            ->name('api.v1.auth.user');

        Route::post('/lupa-kata-sandi', [AuthController::class, 'forgotPassword'])
            ->middleware('throttle:5,1')
            ->name('api.v1.auth.forgot-password');

        Route::post('/atur-ulang-kata-sandi', [AuthController::class, 'resetPassword'])
            ->middleware('throttle:5,1')
            ->name('api.v1.auth.reset-password');
    });

    // Period Context — authenticated
    Route::get('/period-context', [PeriodContextController::class, 'show'])
        ->middleware('auth:sanctum')
        ->name('api.v1.period-context');

    // Profile — authenticated
    Route::prefix('profile')
        ->middleware('auth:sanctum')
        ->group(function () {
            Route::get('/', [ProfileController::class, 'show'])->name('api.v1.profile.show');
            Route::patch('/', [ProfileController::class, 'update'])->name('api.v1.profile.update');
            Route::post('/avatar', [ProfileController::class, 'updateAvatar'])->name('api.v1.profile.avatar');
            Route::patch('/password', [ProfileController::class, 'changePassword'])->name('api.v1.profile.password');
        });

    // Student routes
    require __DIR__.'/api/v1-student.php';

    // Dosen/DPL routes
    require __DIR__.'/api/v1-dosen.php';

    // Admin routes
    require __DIR__.'/api/v1-admin.php';
require __DIR__.'/api/v1-domisili.php';
});

// ── Legacy API (keep existing routes) ─────────────────────────────────────

// Server Time for Timestamp Calibration
Route::get('/server-time', function () {
    return response()->json([
        'server_unix_ms' => now()->getTimestampMs(),
    ]);
})->middleware('throttle:30,1');

// Notifications & Devices
Route::middleware(['auth:sanctum', 'throttle:60,1'])->name('api.')->group(function () {
    Route::prefix('notifications')->name('notifications.')->group(function () {
        Route::get('/unread', [NotificationController::class, 'unread'])->name('unread');
        Route::post('/{id}/read', [NotificationController::class, 'markRead'])->name('mark-read');
        Route::post('/read-all', [NotificationController::class, 'markAllRead'])->name('mark-all-read');
    });

    // Fix Poin 4: Device Tokens for Push Notifications
    Route::post('/device-tokens', [NotificationController::class, 'storeDeviceToken'])->name('device-tokens.store');

    // ─── GEOLOCATION & ATTENDANCE ─────────────────────────────────
    Route::prefix('attendance')->name('attendance.')->group(function () {
        Route::post('/', [AttendanceController::class, 'store'])->name('store');
        Route::get('/', [AttendanceController::class, 'index'])->name('index');
        // Static routes MUST come before wildcard {attendance}
        Route::get('/sync-status', [AttendanceController::class, 'getSyncStatus'])->name('sync-status');
        Route::post('/retry-sync', [AttendanceController::class, 'retrySync'])->name('retry-sync');
        Route::get('/{attendance}', [AttendanceController::class, 'show'])->name('show');
    });
});

// Frontend Error Logging (no auth required - errors can happen before login)
Route::post('log-error', function (Request $request) {
    $validated = $request->validate([
        'message' => 'required|string|max:1000',
        'url' => 'nullable|string|max:1000',
        'stack' => 'nullable|string|max:5000',
    ]);

    $sanitize = fn (string $value): string => preg_replace('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/', '', $value);

    $payload = [
        'message' => $sanitize($validated['message']),
        'url' => isset($validated['url']) ? $sanitize($validated['url']) : null,
        'stack' => isset($validated['stack']) ? $sanitize($validated['stack']) : null,
    ];

    Log::channel('frontend')->error('Frontend Error: '.$payload['message'], $payload);

    return response()->json(['status' => 'logged']);
})->middleware('throttle:10,1')->name('api.log-error');

// ── API Key Distribution System ──────────────────────────────────────────

// Admin: Generate API key (protected by admin secret header)
Route::post('/admin/keys', [AdminKeyController::class, 'store'])
    ->middleware('throttle:10,1')
    ->name('api.admin.keys.store');
Route::post('/admin/keys/{apiKey}/revoke', [AdminKeyController::class, 'revoke'])
    ->middleware('throttle:10,1')
    ->name('api.admin.keys.revoke');

// Self-service: Client registers and receives API key
Route::post('/register', [RegistrationController::class, 'register'])
    ->middleware('throttle:5,1')
    ->name('api.register');

// Public Data API (protected by API key middleware, READ-ONLY)
// NOTE: Uses /data/ prefix to avoid shadowing V1 authenticated routes
Route::middleware(['api.key', 'throttle:60,1'])->prefix('v1/data')->name('api.v1.data.')->group(function () {
    Route::get('/{table}', [PublicDataController::class, 'index'])->name('index');
});
