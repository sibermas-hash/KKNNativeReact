<?php

namespace App\Http\Middleware;

use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class KknThrottleMiddleware extends ThrottleRequests
{
    /**
     * Resolve request signature for rate limiting.
     * Use User ID if authenticated, otherwise IP address.
     */
    protected function resolveRequestSignature($request)
    {
        return hash('xxh128', implode('|', [
            $request->user()?->id ?: $request->ip(),
            $request->route()?->getName() ?: $request->path(),
            $request->ip(),
        ]));
    }

    /**
     * Handle an incoming request.
     */
    public function handle($request, $next, $maxAttempts = 60, $decayMinutes = 1, $prefix = ''): Response
    {
        // Define critical endpoints that need stricter limits
        $criticalEndpoints = [
            'login',
            'password.email',
            'password.update',
            'student.registration.store',
            'student.registration.leave',
            'admin.rekap-nilai.finalize-mass',
            'admin.audit-log.index',
            'dpl.evaluations.import',
        ];

        $routeName = $request->route()->getName();
        
        // ISSUE-MIDDLEWARE-004 Fix: Only bypass in local with debug enabled
        // This prevents production misconfiguration from bypassing rate limits
        if (config('app.env') === 'local' && config('app.debug') === true) {
            return parent::handle($request, $next, $maxAttempts, $decayMinutes, $prefix);
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
}
