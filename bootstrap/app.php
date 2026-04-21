<?php

use App\Http\Middleware\CspHeaders;
use App\Http\Middleware\DisableDebugbar;
use App\Http\Middleware\EnsurePasswordChanged;
use App\Http\Middleware\EnsurePhase;
use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\HandleActivePeriod;
use App\Http\Middleware\HandleInertiaRequests;
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
use Inertia\Inertia;
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
        if (env('APP_ENV') === 'local') {
            $middleware->prepend([
                TestAutoLogin::class,
            ]);
        }

        $middleware->web(append: [
            HandleInertiaRequests::class,
            HandleActivePeriod::class,
            CspHeaders::class,
            SecurityHeaders::class,
            EnsurePasswordChanged::class,
            EnsureUserIsActive::class,
        ]);

        $middleware->api(append: [
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
        ]);

        $middleware->redirectGuestsTo('/login');
        $middleware->redirectUsersTo('/');

        // CSRF Protection: Aktif untuk semua rute web, kecuali endpoint API & webhook
        $middleware->validateCsrfTokens(except: [
            'api/*',
            'webhooks/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        /* AI Self-Healing Disabled
        $exceptions->report(function (\Throwable $e) {
            if (env('APP_ENV') === 'local') {
                app(\App\Services\AI\SelfHealerService::class)->attemptFix($e);
            }
        });
        */

        // Force redirect to login for expired sessions on web routes
        // Prevents raw JSON {"message":"Unauthenticated."} in browser
        $exceptions->render(function (AuthenticationException $e, $request) {
            if (! $request->is('api/*') && ! $request->is('api/v1/*')) {
                return redirect()->guest(route('login'))
                    ->with('warning', 'Sesi Anda telah berakhir. Silakan masuk kembali.');
            }
        });

        $exceptions->render(function (UnauthorizedException $e, $request) {
            if ($request->expectsJson() || $request->is('api/*') || $request->header('Accept') === 'application/json') {
                return response()->json([
                    'message' => 'Forbidden: You do not have permission. '.$e->getMessage(),
                ], 403);
            }
        });
        // Custom rendering for Inertia requests to show the pretty Error page
        $exceptions->respond(function ($response, $e, $request) {
            if (env('APP_ENV') === 'local' && ($request->expectsJson() || $request->header('X-Inertia'))) {
                return $response;
            }

            if ($response instanceof Response || $response instanceof JsonResponse) {
                $status = $response->getStatusCode();
                $user = auth()->user();
                $isStudent = $user?->hasRole('student');

                // Professional handling for Students: Redirect to Dashboard with Toast
                if ($isStudent && in_array($status, [403, 404])) {
                    $message = $status === 403
                        ? ($e->getMessage() ?: 'Akses ditolak: Anda tidak memiliki izin untuk fitur tersebut.')
                        : 'Halaman atau data yang Anda cari tidak ditemukan.';

                    return redirect('/mahasiswa')->with('error', $message);
                }

                // For non-GET Inertia requests (like form submissions that fail with 403)
                if ($status === 403 && $request->header('X-Inertia') && ! $request->isMethod('get')) {
                    return redirect()->back()->with('error', $e->getMessage() ?: 'Anda tidak memiliki akses untuk tindakan ini.');
                }

                // Fallback to pretty error page for fatal errors or other roles
                if (in_array($status, [500, 503, 404, 403])) {
                    return Inertia::render('Error', [
                        'status' => $status,
                        'message' => $status === 403 ? $e->getMessage() : null,
                    ])
                        ->toResponse($request)
                        ->setStatusCode($status);
                }
            }

            return $response;
        });

        // Handle 419 CSRF errors... (rest of the code is already handled by respond above)
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
