<?php

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
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

        $middleware->web(append: [
            \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\HandleActivePeriod::class,
            \App\Http\Middleware\CspHeaders::class,
            \App\Http\Middleware\SecurityHeaders::class,
            \App\Http\Middleware\EnsurePasswordChanged::class,
            \App\Http\Middleware\EnsureUserIsActive::class,
        ]);

        $middleware->api(append: [
            \App\Http\Middleware\EnsureUserIsActive::class,
        ]);

        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
            'kkn.throttle' => \App\Http\Middleware\KknThrottleMiddleware::class,
            'api.key' => \App\Http\Middleware\ValidateApiKey::class,
            'disable.debugbar' => \App\Http\Middleware\DisableDebugbar::class,
            'restrict.debugbar' => \App\Http\Middleware\RestrictDebugbarAccess::class,
            'phase' => \App\Http\Middleware\EnsurePhase::class,
        ]);

        $middleware->redirectGuestsTo('/login');
        $middleware->redirectUsersTo('/');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        /* AI Self-Healing Disabled
        $exceptions->report(function (\Throwable $e) {
            if (app()->environment('local')) {
                app(\App\Services\AI\SelfHealerService::class)->attemptFix($e);
            }
        });
        */
        // Custom rendering for Inertia requests to show the pretty Error page
        $exceptions->respond(function ($response, $e, $request) {
            $status = $response->getStatusCode();

            if (in_array($status, [500, 503, 404, 403])) {
                // If it's an Inertia request or we want to force Inertia error page
                if ($request->header('X-Inertia') || $request->expectsJson()) {
                    return \Inertia\Inertia::render('Error', [
                        'status' => $status,
                        'message' => $status === 403 ? $e->getMessage() : null,
                    ])
                    ->toResponse($request)
                    ->setStatusCode($status);
                }
            }

            if ($status === 419) {
                if ($request->isMethod('GET')) {
                    return \Inertia\Inertia::location($request->fullUrl());
                }

                return back()->with([
                    'error' => 'Sesi Anda telah berakhir untuk keamanan. Sistem sedang menyegarkan akses, silakan coba kirim ulang.',
                ]);
            }

            return $response;
        });

        // Handle 419 CSRF errors... (rest of the code is already handled by respond above)
    })
    ->withSchedule(function (Schedule $schedule): void {
        // Event-driven sync trigger (safe no-op when no trigger file exists).
        $schedule->command('master:webhook:sync')->everyMinute();

        // Check student discipline (logbook 3 days) at 11 PM sesuai Panduan KKN 56
        $schedule->command('kkn:check-discipline')->dailyAt('23:00');
    })
    ->create();
