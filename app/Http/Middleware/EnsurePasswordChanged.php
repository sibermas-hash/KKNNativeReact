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

        if (! $user || ! $user->must_change_password) {
            return $next($request);
        }

        $routeName = $request->route()?->getName();

        if ($routeName && (
            $routeName === 'profile.password-change'
            || $routeName === 'profile.password'
            || $routeName === 'profile.show'
            || in_array($routeName, ['keluar', 'logout'], true)
        )) {
            return $next($request);
        }

        return redirect()
            ->route('profile.password-change')
            ->with('warning', 'Demi keamanan, Anda wajib mengganti kata sandi default sebelum dapat mengakses portal SIBERMAS.');
    }
}
