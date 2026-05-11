<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChanged
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        if ($user->hasRole('superadmin')) {
            // L-002 fix: Retain the superadmin bypass as a break-glass affordance,
            // but emit a warning when the account has never rotated — so ops can
            // see unrotated accounts in the monitoring channel instead of them
            // being silently invisible. Rate-limited to one log per user per
            // hour to avoid flooding.
            $needsRotation = $user->must_change_password || is_null($user->password_changed_at);
            if ($needsRotation) {
                $cacheKey = 'auth:superadmin_unrotated_log:'.$user->id;
                if (Cache::add($cacheKey, 1, now()->addHour())) {
                    Log::warning(
                        'Superadmin account has not rotated default password',
                        [
                            'user_id' => $user->id,
                            'username' => $user->username,
                            'created_at' => $user->created_at?->toIso8601String(),
                        ]
                    );
                }
            }

            return $next($request);
        }

        // Check both flags: explicit must_change_password OR never changed (password_changed_at = null)
        $mustChange = $user->must_change_password || is_null($user->password_changed_at);

        if (! $mustChange) {
            return $next($request);
        }

        // Allow access to password change page, profile, auth routes, and logout
        $routeName = $request->route()?->getName();
        $path = $request->path();

        // Bypass auth routes and profile routes (both legacy and API)
        $allowedRoutes = [
            'profile.password-change', 'profile.password', 'profile.show', 'profile.avatar',
            'api.v1.profile.show', 'api.v1.profile.update', 'api.v1.profile.avatar', 'api.v1.profile.password',
            'logout', 'keluar',
        ];

        if (($routeName && in_array($routeName, $allowedRoutes, true))
            || str_starts_with($path, 'api/v1/auth/')
            || str_starts_with($path, 'api/v1/profile')) {
            return $next($request);
        }

        // Always return JSON 403 — this is a headless API, no web routes for profile pages
        return response()->json([
            'success' => false,
            'error' => [
                'code' => 'PASSWORD_CHANGE_REQUIRED',
                'message' => 'Demi keamanan, Anda wajib mengganti kata sandi default sebelum dapat mengakses portal SIBERMAS.',
            ],
        ], 403);
    }
}
