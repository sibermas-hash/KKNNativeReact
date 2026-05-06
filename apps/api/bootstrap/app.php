<?php

use App\Http\Middleware\CheckPeriodLock;
use App\Http\Middleware\CspHeaders;
use App\Http\Middleware\DisableDebugbar;
use App\Http\Middleware\EnsurePasswordChanged;
use App\Http\Middleware\EnsureProfileCompleted;
use App\Http\Middleware\EnsurePhase;
use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\HandleActivePeriod;
use App\Http\Middleware\KknThrottleMiddleware;
use App\Http\Middleware\RestrictDebugbarAccess;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\TestAutoLogin;
use App\Http\Middleware\ValidateApiKey;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Spatie\Permission\Exceptions\UnauthorizedException;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append([
            // ...
        ]);

        // App is behind reverse proxies (Cloudflare / Nginx), so trust forwarded headers.
        $middleware->trustProxies(at: [
            '127.0.0.1',
            '10.0.0.0/8',
            '172.16.0.0/12',
            '192.168.0.0/16',
            // Cloudflare IPv4 ranges
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
        ]);

        // TestAutoLogin: HANYA aktif di environment lokal untuk keperluan testing
        if (env('APP_ENV', 'production') === 'local') {
            $middleware->prepend([
                TestAutoLogin::class,
            ]);
        }

        $middleware->web(append: [
            HandleActivePeriod::class,
            CspHeaders::class,
            SecurityHeaders::class,
            EnsurePasswordChanged::class,
            EnsureUserIsActive::class,
        ]);

        $middleware->api(append: [
            EnsurePasswordChanged::class,
            EnsureProfileCompleted::class,
            EnsureUserIsActive::class,
        ]);

        $middleware->alias([
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

        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, $request) {
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

        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, $request) {
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

        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException $e, $request) {
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

        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'RATE_LIMITED',
                        'message' => 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
                    ],
                ], 429);
            }
        });

        $exceptions->render(function (\Illuminate\Http\Exceptions\ThrottleRequestsException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'RATE_LIMITED',
                        'message' => 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
                    ],
                ], 429);
            }
        });

        // Catch-all: any unhandled exception on API routes → 500 envelope
        $exceptions->render(function (\Throwable $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
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
        $schedule->command('master:webhook:sync')->everyMinute();

        // Check student discipline (logbook 3 days) at 11 PM sesuai Panduan KKN 56
        $schedule->command('kkn:check-discipline')->dailyAt('23:00');
    })
    ->create();
