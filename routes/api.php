<?php

use App\Http\Controllers\Api\AdminKeyController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\DomisiliController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PublicDataController;
use App\Http\Controllers\Api\RegistrationController;
use App\Http\Controllers\Api\WebhookController;
use App\Http\Middleware\VerifyWebhookSignature;
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

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

if (config('app.env') === 'local') {
    Route::post('/auth/login', function (Request $request) {
        return response()->json(['access_token' => 'student_test_token']);
    });
}

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

    // Domisili (for KKN Mandiri)
    Route::prefix('domisili')->name('domisili.')->group(function () {
        Route::get('/', [DomisiliController::class, 'show'])->name('show');
        Route::post('/', [DomisiliController::class, 'store'])->name('store');
    });

    // ─── GEOLOCATION & ATTENDANCE ─────────────────────────────────
    Route::prefix('attendance')->name('attendance.')->group(function () {
        Route::post('/', [AttendanceController::class, 'store'])->name('store');
        Route::get('/', [AttendanceController::class, 'index'])->name('index');
        Route::get('/{attendance}', [AttendanceController::class, 'show'])->name('show');
        Route::get('/sync-status', [AttendanceController::class, 'getSyncStatus'])->name('sync-status');
        Route::post('/retry-sync', [AttendanceController::class, 'retrySync'])->name('retry-sync');
    });
});

// Frontend Error Logging (no auth required - errors can happen before login)
Route::post('log-error', function (Request $request) {
    $validated = $request->validate([
        'message' => 'required|string|max:2000',
        'url' => 'nullable|string|max:2048',
        'stack' => 'nullable|string|max:10000',
    ]);
    Log::channel('frontend')->error('Frontend Error: '.$validated['message'], $validated);

    return response()->json(['status' => 'logged']);
})->middleware('throttle:10,1')->name('api.log-error');

// Webhooks from Master Data - signature verification FIRST, then rate limit
Route::prefix('webhooks')->group(function () {
    Route::post('/master-data', [WebhookController::class, 'handle'])
        ->middleware([VerifyWebhookSignature::class, 'throttle:10,1'])
        ->name('webhooks.master-data');
});

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

// Public Data API (protected by API key middleware)
Route::middleware(['api.key', 'throttle:60,1'])->prefix('v1')->name('api.v1.')->group(function () {
    Route::get('/{table}', [PublicDataController::class, 'index'])->name('index');
    Route::post('/{table}', [PublicDataController::class, 'store'])->name('store');
    Route::patch('/{table}/{id}', [PublicDataController::class, 'update'])->name('update');
    Route::delete('/{table}/{id}', [PublicDataController::class, 'destroy'])->name('destroy');
});
