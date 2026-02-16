<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\WebhookController;

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
Route::middleware('auth:sanctum')->prefix('notifications')->name('api.notifications.')->group(function () {
    Route::get('/unread', [NotificationController::class, 'unread'])->name('unread');
    Route::post('/{id}/read', [NotificationController::class, 'markRead'])->name('mark-read');
    Route::post('/read-all', [NotificationController::class, 'markAllRead'])->name('mark-all-read');
});

// Webhooks from Master Data
Route::prefix('webhooks')->group(function () {
    Route::post('/master-data', [WebhookController::class, 'handle'])
        ->middleware(\App\Http\Middleware\VerifyWebhookSignature::class)
        ->name('webhooks.master-data');
});
