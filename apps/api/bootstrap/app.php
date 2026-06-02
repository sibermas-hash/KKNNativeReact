<?php

use App\Http\Middleware\AuthenticateWithCookieToken;
use App\Http\Middleware\CheckPeriodLock;
use App\Http\Middleware\CspHeaders;
use App\Http\Middleware\DisableDebugbar;
use App\Http\Middleware\EnsureAdminAuthorization;
use App\Http\Middleware\EnsurePasswordChanged;
use App\Http\Middleware\EnsurePhase;
use App\Http\Middleware\EnsureProfileCompleted;
use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\HandleActivePeriod;
use App\Http\Middleware\KknThrottleMiddleware;
use App\Http\Middleware\RestrictDebugbarAccess;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\TestAutoLogin;
use App\Http\Middleware\ValidateApiKey;
use App\Http\Middleware\VerifyWebhookSignature;
use App\Services\AI\ErrorAlertService;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Exceptions\UnauthorizedException;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append([
            // ...
        ]);

        // App runs behind Nginx/Cloudflare. Correct forwarded headers are
        // critical for Secure cookies and Sanctum login redirects in production.
        $trustedProxies = env('TRUSTED_PROXIES');
        $middleware->trustProxies(at: $trustedProxies
            ? array_filter(array_map('trim', explode(',', $trustedProxies)))
            : [
                '127.0.0.1',
                '::1',
                '10.0.0.0/8',
                '172.16.0.0/12',
                '192.168.0.0/16',
                // Cloudflare official proxy ranges (IPv4 + IPv6):
                // https://www.cloudflare.com/ips/
                '173.245.48.0/20',
                '103.21.244.0/22',
                '103.22.200.0/22',
                '103.31.4.0/22',
                '141.101.64.0/18',
                '108.162.192.0/18',
                '190.93.240.0/20',
                '188.114.96.0/20',
                '197.234.240.0/22',
                '198.41.128.0/17',
                '162.158.0.0/15',
                '104.16.0.0/13',
                '104.24.0.0/14',
                '172.64.0.0/13',
                '131.0.72.0/22',
                '2400:cb00::/32',
                '2606:4700::/32',
                '2803:f800::/32',
                '2405:b500::/32',
                '2405:8100::/32',
                '2a06:98c0::/29',
                '2c0f:f248::/32',
            ]);

        // TestAutoLogin: Guard ada di dalam class handle() sendiri (langsung pass-through
        // jika bukan local/testing). Prepend tanpa conditional karena di Laravel 13
        // app()->environment() belum tersedia saat closure ini dieksekusi.
        // Gunakan route middleware `test.auto-login` untuk route-specific pada masa depan.
        $middleware->prepend([
            TestAutoLogin::class,
        ]);

        $middleware->web(append: [
            HandleActivePeriod::class,
            CspHeaders::class,
            SecurityHeaders::class,
            EnsurePasswordChanged::class,
            EnsureUserIsActive::class,
        ]);

        $middleware->api(
            prepend: [
                AuthenticateWithCookieToken::class,
            ],
            append: [
                EnsurePasswordChanged::class,
                EnsureProfileCompleted::class,
                EnsureUserIsActive::class,
                // Global per-tier rate limiter (roadmap §3.4).
                // Superadmin: Limit::none (unlimited). Admin/faculty_admin: 120/min.
                // DPL/Dosen: 60/min. Student: 60/min. Guest: 30/min IP-based.
                // Routes with tighter per-route throttles still win — this
                // acts as a FLOOR to close gaps on endpoints that had no
                // explicit throttle (e.g. /v1/profile/*).
                'throttle:authenticated',
            ],
        );

        $middleware->alias([
            'test.auto-login' => TestAutoLogin::class,
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
            'throttle' => KknThrottleMiddleware::class,
            'kkn.throttle' => KknThrottleMiddleware::class,
            'api.key' => ValidateApiKey::class,
            'disable.debugbar' => DisableDebugbar::class,
            'restrict.debugbar' => RestrictDebugbarAccess::class,
            'phase' => EnsurePhase::class,
            'not_locked' => CheckPeriodLock::class,
            'admin.auth' => EnsureAdminAuthorization::class,
            'webhook.signature' => VerifyWebhookSignature::class,
        ]);

        $middleware->redirectGuestsTo('/login');
        $middleware->redirectUsersTo('/');

        // CSRF Protection: exclude API and webhook routes (they use Bearer tokens / HMAC)
        $middleware->validateCsrfTokens(except: [
            'api/*',
            'webhooks/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // ── API JSON error envelope ──────────────────────────────────────────
        // All /api/* requests get a consistent { success, error } envelope.
        // Web requests keep existing behavior.

        $exceptions->render(function (AuthenticationException $e, $request) {
            // API: return 401 JSON envelope
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'UNAUTHORIZED',
                        'message' => 'Tidak terotentikasi. Silakan masuk terlebih dahulu.',
                    ],
                ], 401);
            }

            // Web: redirect to login
            return redirect()->guest(route('login'))
                ->with('warning', 'Sesi Anda telah berakhir. Silakan masuk kembali.');
        });

        $exceptions->render(function (UnauthorizedException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'FORBIDDEN',
                        'message' => 'Akses ditolak. '.$e->getMessage(),
                    ],
                ], 403);
            }
        });

        $exceptions->render(function (ValidationException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'VALIDATION_ERROR',
                        'message' => 'Data yang diberikan tidak valid.',
                        'errors' => $e->errors(),
                    ],
                ], 422);
            }
        });

        $exceptions->render(function (NotFoundHttpException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'NOT_FOUND',
                        'message' => 'Endpoint atau data tidak ditemukan.',
                    ],
                ], 404);
            }
        });

        $exceptions->render(function (MethodNotAllowedHttpException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'METHOD_NOT_ALLOWED',
                        'message' => 'Metode HTTP tidak diizinkan untuk endpoint ini.',
                    ],
                ], 405);
            }
        });

        $exceptions->render(function (TooManyRequestsHttpException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                // Preserve rate-limit headers (Retry-After, X-RateLimit-*) from
                // the original exception so clients can implement proper back-off.
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'RATE_LIMITED',
                        'message' => 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
                    ],
                ], 429, $e->getHeaders());
            }
        });

        $exceptions->render(function (ThrottleRequestsException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'RATE_LIMITED',
                        'message' => 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
                    ],
                ], 429, $e->getHeaders());
            }
        });

        // Preserve HTTP exceptions (signed URL, abort(403/404), etc.) instead of
        // converting them to generic 500 responses.
        $exceptions->render(function (HttpExceptionInterface $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                $status = $e->getStatusCode();
                $code = match ($status) {
                    401 => 'UNAUTHORIZED',
                    403 => 'FORBIDDEN',
                    404 => 'NOT_FOUND',
                    405 => 'METHOD_NOT_ALLOWED',
                    429 => 'RATE_LIMITED',
                    default => 'HTTP_ERROR',
                };

                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => $code,
                        'message' => $e->getMessage() ?: 'Permintaan tidak dapat diproses.',
                    ],
                ], $status, $e->getHeaders());
            }
        });

        // Catch-all: any unhandled exception on API routes → 500 envelope
        $exceptions->render(function (Throwable $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                // AI-powered Telegram alert for server errors
                try {
                    app(ErrorAlertService::class)->alertBackendError(
                        $e,
                        $request->fullUrl(),
                        $request->user()?->id,
                    );
                } catch (Throwable) {
                    // Alert failure must never break the response
                }

                $message = config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan internal.';

                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'SERVER_ERROR',
                        'message' => $message,
                    ],
                ], 500);
            }
        });

        // ── Web error handling ───────────────────────────────────────────────
        $exceptions->respond(function ($response, $e, $request) {
            // Skip if already handled as API
            if ($request->is('api/*')) {
                return $response;
            }

            if ($response instanceof Response || $response instanceof JsonResponse) {
                $status = $response->getStatusCode();

                if (in_array($status, [500, 503, 404, 403])) {
                    return response()->json([
                        'success' => false,
                        'error' => [
                            'code' => $status === 500 ? 'SERVER_ERROR' : ($status === 404 ? 'NOT_FOUND' : 'FORBIDDEN'),
                            'message' => $e->getMessage() ?: 'Terjadi kesalahan.',
                        ],
                    ], $status);
                }
            }

            return $response;
        });
    })
    ->withSchedule(function (Schedule $schedule): void {
        // Auto sync phase based on dates - runs every hour
        $schedule->command('kkn:auto-sync-phase')->hourly();

        // Event-driven sync trigger (safe no-op when no trigger file exists).
        // DISABLED 2026-05: SIAKAD sync is now a superadmin-triggered manual
        // action (POST /api/v1/admin/sync/run-with-backup), with a fresh
        // pg_dump backup taken BEFORE every run. The trigger-file polling
        // job produced noise in ops logs and could silently overwrite
        // admin-locked fields when SIAKAD payloads regressed. Leave the
        // command (MasterWebhookSync) in place for one-off manual runs
        // via `php artisan master:webhook:sync` if needed.
        // $schedule->command('master:webhook:sync')->everyMinute();

        // Check student discipline (logbook 3 days) at 11 PM sesuai Panduan KKN 56
        $schedule->command('kkn:check-discipline')->dailyAt('23:00');

        // R-005: prune expired mass-certificate ZIPs (signed URL TTL=2h,
        // retention buffer 6h). Cleans up storage/app/private/exports/.
        $schedule->command('certificates:prune-exports')->hourly();

        // R-004: prune completed webhook idempotency rows (default 7d retention).
        // Failed rows are retained for ops investigation.
        $schedule->command('webhooks:prune')->dailyAt('02:30');

        // AI-powered Telegram alerts
        $schedule->command('telegram:daily-digest')->dailyAt('21:00');
        $schedule->command('telegram:anomaly-check')->everyThirtyMinutes();
    })
    ->create();
