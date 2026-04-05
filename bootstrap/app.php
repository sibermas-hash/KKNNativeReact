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
        // Only trust private/loopback ranges and Cloudflare IPs.
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
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\HandleActivePeriod::class,
            \App\Http\Middleware\CspHeaders::class,
            \App\Http\Middleware\EnsurePasswordChanged::class,
            \App\Http\Middleware\EnsureAdminAuthorization::class,
        ]);

        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
            'kkn.throttle' => \App\Http\Middleware\KknThrottleMiddleware::class,
            'api.key' => \App\Http\Middleware\ValidateApiKey::class,
            'disable.debugbar' => \App\Http\Middleware\DisableDebugbar::class,
            'restrict.debugbar' => \App\Http\Middleware\RestrictDebugbarAccess::class,
        ]);

        $middleware->redirectGuestsTo('/login');
        $middleware->redirectUsersTo('/');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Handle 419 CSRF errors for Inertia requests
        $exceptions->render(function (\Illuminate\Session\TokenMismatchException $e, $request) {
            if ($request->header('X-Inertia')) {
                return redirect()->route('login')->with('error', 'Sesi Anda telah berakhir. Silakan login kembali.');
            }
        });

        // Handle 404 Not Found
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, $request) {
            if ($request->header('X-Inertia') || $request->expectsJson()) {
                return response()->json([
                    'message' => 'Halaman tidak ditemukan.',
                ], 404);
            }
        });

        // Handle 500 Internal Server Error (hide details in production)
        $exceptions->render(function (\Throwable $e, $request) {
            if (
                $e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface
                || $e instanceof \Illuminate\Validation\ValidationException
                || $e instanceof \Illuminate\Auth\AuthenticationException
                || $e instanceof \Illuminate\Auth\Access\AuthorizationException
            ) {
                return null;
            }

            // Log the error
            \Illuminate\Support\Facades\Log::error('Unhandled Exception', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            // For API requests, return JSON error
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan server.',
                ], 500);
            }

            // For Inertia requests, redirect to error page
            if ($request->header('X-Inertia')) {
                if (!config('app.debug')) {
                    return redirect()->back()->with('error', 'Terjadi kesalahan. Silakan coba lagi.');
                }
            }
        });
    })
    ->withSchedule(function (Schedule $schedule): void {
        // Event-driven sync trigger (safe no-op when no trigger file exists).
        $schedule->command('master:webhook:sync')->everyMinute();
        
        // Daily database backup at 2 AM
        $schedule->command('db:backup --keep=7')->dailyAt('02:00');
    })
    ->create();
