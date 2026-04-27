<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChanged
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        // Admin roles handle their own security flow
        if ($user->hasRole(['superadmin', 'admin', 'faculty_admin'])) {
            return $next($request);
        }

        // Check both flags: explicit must_change_password OR never changed (password_changed_at = null)
        $mustChange = $user->must_change_password || is_null($user->password_changed_at);

        if (! $mustChange) {
            return $next($request);
        }

        // Allow access to password change page, profile, and logout
        $routeName = $request->route()?->getName();

        if ($routeName && in_array($routeName, [
            'profile.password-change',
            'profile.password',
            'profile.show',
            'keluar',
            'logout',
        ], true)) {
            return $next($request);
        }

        return redirect()
            ->route('profile.password-change')
            ->with('warning', 'Demi keamanan, Anda wajib mengganti kata sandi default sebelum dapat mengakses portal SIBERMAS.');
    }
}

