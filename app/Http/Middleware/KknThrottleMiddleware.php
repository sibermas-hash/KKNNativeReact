<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class KknThrottleMiddleware extends ThrottleRequests
{
    /**
     * Handle CSRF validation failures with detailed logging.
     */
    public function handle($request, $next, $maxAttempts = 60, $decayMinutes = 1, $prefix = ''): Response
    {
        // Skip rate limiting in local environment completely
        if (config('app.env') === 'local') {
            \Log::debug('Rate limiting skipped (local env)', ['route' => $request->route()?->getName()]);
            return $next($request);
        }

        // ... rest of the original code stays here
        // Define critical endpoints that need stricter limits
        $criticalEndpoints = [
            'password.email',
            'password.update',
            'student.registration.store',
            'student.registration.leave',
            'admin.grade-reports.finalisasi-massal',
            'admin.audit-log.index',
            'dpl.evaluations.import',
        ];

        $routeName = $request->route()?->getName();

        // If no route name (e.g., static file or 404), use path
        if (! $routeName) {
            $routeName = $request->path();
        }

        // Halaman login harus longgar agar mahasiswa dari IP yang sama tidak
        // saling menahan hanya untuk membuka form autentikasi.
        if ($routeName === 'login') {
            $maxAttempts = 300;
            $decayMinutes = 1;
        }

        // Submit login tetap dibatasi, tetapi jauh lebih longgar daripada
        // brute-force limiter di LoginRequest karena banyak mahasiswa bisa
        // berbagi IP yang sama saat hari-H.
        if ($routeName === 'login.store') {
            $maxAttempts = 240;
            $decayMinutes = 1;
        }

        // Strict limit for critical endpoints: 10 attempts per 5 minutes
        if (in_array($routeName, $criticalEndpoints)) {
            $maxAttempts = 10;
            $decayMinutes = 5;
        }

        // ISSUE-ROUTE-001 Fix: Stricter password reset rate limiting
        if ($routeName === 'password.email') {
            $maxAttempts = 3;
            $decayMinutes = 60; // 3 attempts per hour
        }

        if ($routeName === 'password.update') {
            $maxAttempts = 5;
            $decayMinutes = 60; // 5 attempts per hour
        }

        if ($routeName === 'student.registration.store') {
            $maxAttempts = 20;
            $decayMinutes = 1;
        }

        if ($routeName === 'student.registration.leave') {
            $maxAttempts = 10;
            $decayMinutes = 1;
        }

        // Extremely strict for bulk operations: 5 per hour
        if (str_contains($routeName, 'bulk') || str_contains($routeName, 'mass')) {
            $maxAttempts = 5;
            $decayMinutes = 60;
        }

        return parent::handle($request, $next, $maxAttempts, $decayMinutes, $prefix);
    }

    /**
     * Resolve request signature for rate limiting.
     * Use User ID if authenticated, otherwise IP address.
     */
    protected function resolveRequestSignature($request)
    {
        $routeName = $request->route()?->getName();

        $guestIdentifier = $request->ip();
        if (! $request->user() && $routeName === 'login.store' && $request->filled('login')) {
            $guestIdentifier = Str::transliterate(Str::lower((string) $request->input('login'))).'|'.$request->ip();
        }

        return hash('xxh128', implode('|', [
            $request->user()?->id ?: $guestIdentifier,
            $routeName ?: $request->path(),
            $request->ip(),
        ]));
    }

    }
