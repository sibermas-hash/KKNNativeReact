<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChanged
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->must_change_password) {
            return $next($request);
        }

        $routeName = $request->route()?->getName();

        if ($routeName && (str_starts_with($routeName, 'profile.') || $routeName === 'logout')) {
            return $next($request);
        }

        return redirect()
            ->route('profile.show')
            ->with('warning', 'Akun Anda baru diaktifkan. Silakan ganti kata sandi sementara sebelum melanjutkan.');
    }
}
