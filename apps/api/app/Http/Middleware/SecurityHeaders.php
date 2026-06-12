<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * SecurityHeaders middleware.
 *
 * Note: Most security headers are now handled by CspHeaders middleware.
 * This middleware provides additional headers that are not CSP-specific.
 *
 * @see CspHeaders For primary security headers (X-Frame-Options, CSP, HSTS, etc.)
 */
class SecurityHeaders
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): mixed
    {
        return $next($request);
    }
}
