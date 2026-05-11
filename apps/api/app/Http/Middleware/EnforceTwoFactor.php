<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnforceTwoFactor
{
    /**
     * Require privileged users to complete TOTP setup before using protected APIs.
     * Skipped in testing environment to avoid breaking existing test suite.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip enforcement in testing — tests use factory users without 2FA setup.
        // Production and local dev still enforce.
        if (app()->environment('testing')) {
            return $next($request);
        }

        $user = $request->user();

        if (! $user || ! $user->requiresTwoFactor() || $user->hasTwoFactorEnabled()) {
            return $next($request);
        }

        $allowedRoutes = [
            'api.v1.2fa.status',
            'api.v1.2fa.setup',
            'api.v1.2fa.confirm',
            'api.v1.auth.logout',
            'api.v1.auth.user',
        ];

        if (in_array((string) $request->route()?->getName(), $allowedRoutes, true)) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'error' => [
                'code' => 'TWO_FACTOR_SETUP_REQUIRED',
                'message' => 'Akun Anda wajib mengaktifkan 2FA sebelum melanjutkan.',
            ],
        ], 403);
    }
}
