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

// Notifications
Route::middleware(['auth:sanctum', 'throttle:60,1'])->prefix('notifications')->name('api.notifications.')->group(function () {
    Route::get('/unread', [NotificationController::class , 'unread'])->name('unread');
    Route::post('/{id}/read', [NotificationController::class , 'markRead'])->name('mark-read');
    Route::post('/read-all', [NotificationController::class , 'markAllRead'])->name('mark-all-read');
});

// Webhooks from Master Data
Route::prefix('webhooks')->middleware('throttle:30,1')->group(function () {
    Route::post('/master-data', [WebhookController::class , 'handle'])
        ->middleware(\App\Http\Middleware\VerifyWebhookSignature::class)
        ->name('webhooks.master-data');
});

// ── API Key Distribution System ──────────────────────────────────────────

// Admin: Generate API key (protected by admin secret header)
Route::post('/admin/keys', [AdminKeyController::class , 'store'])
    ->middleware('throttle:10,1')
    ->name('api.admin.keys.store');

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