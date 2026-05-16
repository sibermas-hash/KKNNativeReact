<?php

use App\Http\Controllers\AiAssistantController;
use App\Http\Controllers\Api\AdminKeyController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\NotificationStreamController;
use App\Http\Controllers\Api\PublicDataController;
use App\Http\Controllers\Api\RegistrationController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\PeriodContextController;
use App\Http\Controllers\Api\V1\PrivateFileController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\PublicController;
use App\Http\Controllers\Api\V1\Student\ChatController;
use App\Http\Controllers\Api\V1\TotpController;
use App\Http\Controllers\Api\WebhookController;
use App\Http\Controllers\HealthController;
use App\Services\AI\ErrorAlertService;
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
    // Public endpoints — no auth required. Uses named 'public' tier
    // (30/min IP-based) defined in AppServiceProvider.
    Route::prefix('public')->middleware('throttle:public')->group(function () {
        Route::get('/home', [PublicController::class, 'home'])->name('api.v1.public.home');
        Route::get('/announcements', [PublicController::class, 'announcements'])->name('api.v1.public.announcements');
        Route::get('/announcements/{slug}', [PublicController::class, 'announcementBySlug'])->name('api.v1.public.announcements.show');
        // Split views by content-type (disimpan di model constant
        // TYPE_BERITA_CATEGORIES & TYPE_PENGUMUMAN_CATEGORIES).
        Route::get('/berita', [PublicController::class, 'berita'])->name('api.v1.public.berita');
        Route::get('/berita/{slug}', [PublicController::class, 'announcementBySlug'])->name('api.v1.public.berita.show');
        Route::get('/pengumuman', [PublicController::class, 'pengumuman'])->name('api.v1.public.pengumuman');
        Route::get('/pengumuman/{slug}', [PublicController::class, 'announcementBySlug'])->name('api.v1.public.pengumuman.show');
        Route::get('/popup-announcement', [PublicController::class, 'popupAnnouncement'])->name('api.v1.public.popup-announcement');
        Route::get('/locations', [PublicController::class, 'locations'])->name('api.v1.public.locations');
        Route::get('/downloads', [PublicController::class, 'downloads'])->name('api.v1.public.downloads');
        Route::get('/verify-certificate/{token}', [PublicController::class, 'verifyCertificate'])->name('api.v1.public.verify-certificate');
    });

    // Auth — public. Uses named 'auth_challenge' tier (10/min IP-based)
    // for captcha + login. Forgot/reset keep the stricter 5/min to deter
    // enumeration (narrower wins over auth_challenge anyway).
    Route::prefix('auth')->group(function () {
        Route::get('/captcha', [AuthController::class, 'captcha'])
            ->middleware('throttle:auth_challenge')
            ->name('api.v1.auth.captcha');

        Route::post('/login', [AuthController::class, 'login'])
            ->middleware('throttle:auth_challenge')
            ->name('api.v1.auth.login');

        Route::post('/2fa-verify', [AuthController::class, 'twoFactorVerify'])
            ->middleware('throttle:auth_challenge')
            ->name('api.v1.auth.2fa-verify');

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
            Route::match(['patch', 'post'], '/password', [ProfileController::class, 'changePassword'])->name('api.v1.profile.password');
            Route::get('/notification-preferences', [ProfileController::class, 'notificationPreferences'])->name('api.v1.profile.notification-preferences.show');
            Route::patch('/notification-preferences', [ProfileController::class, 'updateNotificationPreferences'])->name('api.v1.profile.notification-preferences.update');
        });

    // Chat Konsultasi (PRD_CHAT_SYSTEM.md) — mahasiswa/dosen ↔ superadmin
    Route::prefix('chat')
        ->middleware(['auth:sanctum', 'not_locked'])
        ->group(function () {
            Route::get('/', [ChatController::class, 'index']);
            Route::post('/', [ChatController::class, 'store'])->middleware('throttle:10,1');
            Route::get('/{conversation}', [ChatController::class, 'show']);
            Route::post('/{conversation}/messages', [ChatController::class, 'sendMessage'])->middleware('throttle:20,1');
        });

    // 2FA (TOTP) — Google Authenticator compatible
    Route::prefix('2fa')
        ->middleware('auth:sanctum')
        ->group(function () {
            Route::get('/status', [TotpController::class, 'status'])->name('api.v1.2fa.status');
            Route::post('/setup', [TotpController::class, 'setup'])->name('api.v1.2fa.setup');
            Route::post('/confirm', [TotpController::class, 'confirm'])->name('api.v1.2fa.confirm');
            Route::post('/disable', [TotpController::class, 'disable'])->name('api.v1.2fa.disable');
            Route::post('/regenerate-recovery', [TotpController::class, 'regenerateRecovery'])->name('api.v1.2fa.regenerate-recovery');
        });

    // Private file downloads (X-002 + X-003): attendance photos & workshop
    // certificates live on the private disk and are served from here with
    // per-record authorization checks.
    Route::prefix('files')
        ->middleware('auth:sanctum')
        ->group(function () {
            Route::get('/attendance-photos/{photo}', [PrivateFileController::class, 'attendancePhoto'])
                ->middleware('signed')
                ->name('api.v1.files.attendance-photo');
            Route::get('/workshop-certificates/{participant}', [PrivateFileController::class, 'workshopCertificate'])
                ->middleware('signed')
                ->name('api.v1.files.workshop-certificate');
            Route::get('/chat-attachment/{message}', [PrivateFileController::class, 'chatAttachment'])
                ->middleware('signed')
                ->name('api.v1.files.chat-attachment');
        });

    // Student routes
    require __DIR__.'/api/v1-student.php';

    // Dosen/DPL routes
    require __DIR__.'/api/v1-dosen.php';

    // Admin routes
    require __DIR__.'/api/v1-admin.php';
});

// ── Notifications & Attendance (versioned aliases untuk unified client) ────
Route::middleware(['auth:sanctum', 'throttle:60,1'])->prefix('v1')->group(function () {
    Route::prefix('notifications')->name('api.v1.notifications.')->group(function () {
        Route::get('/', [NotificationController::class, 'index'])->name('index');
        Route::get('/unread', [NotificationController::class, 'unread'])->name('unread');
        Route::post('/{id}/read', [NotificationController::class, 'markRead'])->name('mark-read');
        Route::post('/read-all', [NotificationController::class, 'markAllRead'])->name('mark-all-read');
    });

    Route::get('/notifications/stream', [NotificationStreamController::class, 'stream'])
        ->middleware('throttle:5,1')
        ->name('api.v1.notifications.stream');

    Route::post('/device-tokens', [NotificationController::class, 'storeDeviceToken'])->name('api.v1.device-tokens.store');

    Route::prefix('attendance')->name('api.v1.attendance.')->group(function () {
        Route::post('/', [AttendanceController::class, 'store'])->name('store');
        Route::get('/', [AttendanceController::class, 'index'])->name('index');
        Route::get('/sync-status', [AttendanceController::class, 'getSyncStatus'])->name('sync-status');
        Route::post('/retry-sync', [AttendanceController::class, 'retrySync'])->name('retry-sync');
        Route::get('/{attendance}', [AttendanceController::class, 'show'])->name('show');
    });
});

// ── AI Chat Assistant ──────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'throttle:20,1'])->prefix('v1/ai')->group(function () {
    Route::get('/history', [AiAssistantController::class, 'history'])->name('api.v1.ai.history');
    Route::post('/chat', [AiAssistantController::class, 'chat'])->name('api.v1.ai.chat');
    Route::delete('/clear', [AiAssistantController::class, 'clear'])->name('api.v1.ai.clear');
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
        Route::get('/', [NotificationController::class, 'index'])->name('index');
        Route::get('/unread', [NotificationController::class, 'unread'])->name('unread');
        Route::post('/{id}/read', [NotificationController::class, 'markRead'])->name('mark-read');
        Route::post('/read-all', [NotificationController::class, 'markAllRead'])->name('mark-all-read');
    });

    // Real-time SSE stream — outside the grouped throttle namespace since
    // it's long-lived (one connection / 60s / user, not request-per-second).
    // R13-API-012: even so, we cap at 5 connection attempts per minute per
    // user to prevent a single client opening hundreds of streams and
    // exhausting PHP-FPM workers.
    Route::get('/notifications/stream', [NotificationStreamController::class, 'stream'])
        ->middleware('throttle:5,1')
        ->name('notifications.stream');

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

// Frontend Error Logging — requires authentication (H-005 fix).
// Anonymous log submission let anyone flood the log channel (10/min/IP).
// Now scoped to authenticated users with a tighter bucket (5/5min/user).
Route::post('log-error', function (Request $request) {
    $validated = $request->validate([
        'message' => 'required|string|max:1000',
        'url' => 'nullable|string|max:1000',
        'stack' => 'nullable|string|max:500',
    ]);

    $sanitize = fn (string $value): string => preg_replace('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/', '', $value);

    $payload = [
        'message' => $sanitize($validated['message']),
        'url' => isset($validated['url']) ? $sanitize($validated['url']) : null,
        'stack' => isset($validated['stack']) ? $sanitize($validated['stack']) : null,
        'user_id' => $request->user()?->id,
    ];

    Log::channel('frontend')->error('Frontend Error: '.$payload['message'], $payload);

    // AI-powered Telegram alert for frontend errors
    try {
        app(ErrorAlertService::class)->alertFrontendError(
            $payload['message'],
            $payload['url'],
            $payload['stack'],
            $payload['user_id'],
        );
    } catch (Throwable) {
        // Alert failure must never break the response
    }

    return response()->json(['status' => 'logged']);
})->middleware(['auth:sanctum', 'throttle:5,5'])->name('api.log-error');

// ── API Key Distribution System ──────────────────────────────────────────

// Admin: Generate API key (protected by admin secret header + auth)
Route::post('/admin/keys', [AdminKeyController::class, 'store'])
    ->middleware(['auth:sanctum', 'role:superadmin', 'throttle:10,1'])
    ->name('api.admin.keys.store');
Route::post('/admin/keys/{apiKey}/revoke', [AdminKeyController::class, 'revoke'])
    ->middleware(['auth:sanctum', 'role:superadmin', 'throttle:10,1'])
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

// MCP Server (Laravel AI) — loaded separately for middleware isolation
require __DIR__.'/ai.php';

// ── SIAKAD Master API Webhooks ────────────────────────────────────────────
// HMAC-signed push events from SIAKAD. No auth required — verified by
// webhook.signature middleware (X-Hub-Signature + X-Webhook-Timestamp).
Route::prefix('webhooks')
    ->middleware(['webhook.signature', 'throttle:60,1'])
    ->group(function () {
        Route::post('/master', [WebhookController::class, 'handle'])
            ->name('api.webhooks.master');
    });
