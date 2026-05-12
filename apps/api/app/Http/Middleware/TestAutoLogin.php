<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TestAutoLogin
{
    /**
     * Handle an incoming request.
     * Automatically logs in a user if X-Test-Login header is present (Testing ONLY).
     *
     * SECURITY WARNING: This bypasses authentication and should only be used in:
     * - Local development environment
     * - Explicitly enabled via X-Test-Mode: enabled header
     *
     * Never deploy this to production without disabling it.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Hard-gate: silently pass through in non-local/testing environments.
        // abort(500) was replaced with a transparent pass-through because the
        // middleware is prepended globally (Laravel 13 boot sequence does not
        // allow conditional registration in withMiddleware). Throwing 500 on
        // every production request — including public endpoints — is wrong.
        if (! app()->environment(['local', 'testing'])) {
            return $next($request);
        }

        // SECURITY: Only allow when explicitly enabled via config AND header is present.
        // NEVER use config('app.env') for security decisions.
        $testAutoLoginEnabled = config('auth.test_auto_login_enabled', false);
        $testModeEnabled = $request->header('X-Test-Mode') === 'enabled';

        if (! ($testAutoLoginEnabled && $testModeEnabled)) {
            return $next($request);
        }

        // H-002 fix: Only honor the explicit X-Test-Login header. The previous
        // implementation sniffed bearer tokens for substrings like "admin" and
        // logged anyone in as admin — a full authentication bypass if this
        // middleware ever got loaded in the wrong environment.
        $testLoginHeader = $request->header('X-Test-Login');

        $isSensitivePath = $request->is('mahasiswa*', 'admin*', 'api*', 'dpl*');

        if ($isSensitivePath) {
            $request->headers->set('Accept', 'application/json');
            $_SERVER['HTTP_ACCEPT'] = 'application/json';
        }

        if ($testLoginHeader) {
            $username = $testLoginHeader;
            \Log::info('TestAutoLogin: Attempting login for '.$username.' based on X-Test-Login header.');

            $user = User::where('username', $username)->first();

            if ($user) {
                auth('web')->login($user);
                $request->setUserResolver(fn () => $user);

                if ($username === 'student' && ! $user->hasRole('student')) {
                    $user->assignRole('student');
                }
                if ($username === 'admin' && ! $user->hasRole('superadmin')) {
                    $user->assignRole('superadmin');
                }
                if ($username === 'dpl' && ! $user->hasRole('dosen')) {
                    $user->assignRole('dosen');
                }
                if ($username === 'dpl' && ! $user->hasRole('dpl')) {
                    $user->assignRole('dpl');
                }

                \Log::info('TestAutoLogin: Success. Logged in User ID: '.$user->id);
            } else {
                \Log::warning('TestAutoLogin: User not found: '.$username);
            }
        }

        return $next($request);
    }
}
