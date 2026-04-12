<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\WebhookController;
use App\Http\Controllers\Api\AdminKeyController;
use App\Http\Controllers\Api\RegistrationController;
use App\Http\Controllers\Api\PublicDataController;

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

// Notifications & Devices
Route::middleware(['auth:sanctum', 'throttle:60,1'])->name('api.')->group(function () {
    Route::prefix('notifications')->name('notifications.')->group(function () {
        Route::get('/unread', [NotificationController::class , 'unread'])->name('unread');
        Route::post('/{id}/read', [NotificationController::class , 'markRead'])->name('mark-read');
        Route::post('/read-all', [NotificationController::class , 'markAllRead'])->name('mark-all-read');
    });
    
    // Fix Poin 4: Device Tokens for Push Notifications
    Route::post('/device-tokens', [NotificationController::class, 'storeDeviceToken'])->name('device-tokens.store');
});

// Frontend Error Logging (no auth required - errors can happen before login)
Route::post('log-error', function (Request $request) {
    \Illuminate\Support\Facades\Log::channel('frontend')->error('Frontend Error: ' . $request->input('message'), $request->all());
    return response()->json(['status' => 'logged']);
})->middleware('throttle:10,1')->name('api.log-error');

// Webhooks from Master Data - signature verification FIRST, then rate limit
Route::prefix('webhooks')->group(function () {
    Route::post('/master-data', [WebhookController::class , 'handle'])
        ->middleware([\App\Http\Middleware\VerifyWebhookSignature::class, 'throttle:10,1'])
        ->name('webhooks.master-data');
});

// ── API Key Distribution System ──────────────────────────────────────────

// Admin: Generate API key (protected by admin secret header)
Route::post('/admin/keys', [AdminKeyController::class , 'store'])
    ->middleware('throttle:10,1')
    ->name('api.admin.keys.store');
Route::post('/admin/keys/{apiKey}/revoke', [AdminKeyController::class, 'revoke'])
    ->middleware('throttle:10,1')
    ->name('api.admin.keys.revoke');

// Self-service: Client registers and receives API key
Route::post('/register', [RegistrationController::class , 'register'])
    ->middleware('throttle:5,1')
    ->name('api.register');

// Public Data API (protected by API key middleware)
Route::middleware(['api.key', 'throttle:60,1'])->prefix('v1')->name('api.v1.')->group(function () {
    Route::get('/{table}', [PublicDataController::class , 'index'])->name('index');
    Route::post('/{table}', [PublicDataController::class , 'store'])->name('store');
    Route::patch('/{table}/{id}', [PublicDataController::class , 'update'])->name('update');
    Route::delete('/{table}/{id}', [PublicDataController::class , 'destroy'])->name('destroy');
});
