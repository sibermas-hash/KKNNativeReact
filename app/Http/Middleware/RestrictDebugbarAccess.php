<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restrict access to Debugbar and Telescope to superadmin only.
 */
class RestrictDebugbarAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        // Allow in local development
        if (app()->environment('local')) {
            return $next($request);
        }

        // In production/staging, only superadmin can access
        $user = $request->user();

        if (! $user || ! $user->hasRole('superadmin')) {
            abort(403, 'Access denied. Debug tools are restricted to administrators only.');
        }

        return $next($request);
    }
}
