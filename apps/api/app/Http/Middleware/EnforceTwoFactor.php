<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnforceTwoFactor
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        if (method_exists($user, 'requiresTwoFactor') && $user->requiresTwoFactor() && ! $user->hasTwoFactorEnabled()) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'TWO_FACTOR_SETUP_REQUIRED',
                    'message' => 'Akun Anda wajib mengaktifkan 2FA sebelum mengakses menu admin.',
                ],
            ], 403);
        }

        return $next($request);
    }
}
