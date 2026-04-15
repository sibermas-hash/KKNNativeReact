<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if ($user && ! $user->is_active) {
            // For API requests, return JSON response
            if ($request->expectsJson() || $request->is('api/*')) {
                Auth::guard('sanctum')->logout();

                return response()->json([
                    'message' => 'Akun Anda telah dinonaktifkan. Silakan hubungi administrator.',
                ], 403);
            }

            // For web requests, redirect to login
            Auth::logout();

            return redirect()
                ->route('login')
                ->withErrors([
                    'email' => 'Akun Anda telah dinonaktifkan. Silakan hubungi administrator.',
                ]);
        }

        return $next($request);
    }
}
