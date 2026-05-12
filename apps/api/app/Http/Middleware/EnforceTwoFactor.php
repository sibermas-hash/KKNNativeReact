<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Privileged users (superadmin / admin / faculty_admin / dpl) MUST enable
 * 2FA before accessing protected endpoints. But we can't block them from
 * their OWN onboarding — otherwise a fresh superadmin cannot reach the
 * 2FA setup page, and the system is un-bootable.
 *
 * Allowed for ALL users (even without 2FA):
 *   - 2FA setup flow itself
 *   - auth: logout / current user
 *   - profile page + password change + avatar (so the admin can land on
 *     /admin/pengaturan/keamanan and scan the QR)
 *
 * Grace period (optional, env-driven):
 *   - `auth.two_factor.grace_period_hours` (default 0 = no grace).
 *   - If set > 0 and user was created < N hours ago, all endpoints are
 *     unblocked. A warning is logged on every access during grace so ops
 *     notice if someone is coasting on the grace window.
 *
 * Deliberately skipped in testing to avoid having to fake 2FA in every
 * feature test.
 */
class EnforceTwoFactor
{
    /**
     * Endpoints that MUST remain reachable even when the user has not
     * completed 2FA setup yet — otherwise they can never reach the setup
     * page in the first place.
     */
    private const ONBOARDING_ROUTES = [
        // 2FA setup flow
        'api.v1.2fa.status',
        'api.v1.2fa.setup',
        'api.v1.2fa.confirm',
        'api.v1.2fa.disable',
        'api.v1.2fa.regenerate-recovery',

        // Auth basics (logout + "who am I")
        'api.v1.auth.logout',
        'api.v1.auth.user',
        'api.v1.auth.2fa-verify',

        // Profile page data — the admin security page /admin/pengaturan/keamanan
        // and /profil page render from these endpoints. Without them the page
        // is a 403 and the QR-code component never mounts.
        'api.v1.profile.show',
        'api.v1.profile.update',
        'api.v1.profile.password',
        'api.v1.profile.avatar',
        'api.v1.profile.notification-preferences.show',
        'api.v1.profile.notification-preferences.update',

        // App layout needs the period context to render header/sidebar.
        'api.v1.period-context',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        // Tests run without 2FA setup; don't break the suite.
        if (app()->environment('testing')) {
            return $next($request);
        }

        $user = $request->user();

        // No user, or 2FA not required for this user, or already enabled —
        // nothing to enforce.
        if (! $user || ! $user->requiresTwoFactor() || $user->hasTwoFactorEnabled()) {
            return $next($request);
        }

        // Grace period: freshly-provisioned privileged accounts get a short
        // window to discover the setup flow. Default OFF (0 hours) so the
        // old tight behaviour is preserved unless ops opts in.
        $graceHours = (int) config('auth.two_factor.grace_period_hours', 0);
        if ($graceHours > 0 && $user->created_at?->addHours($graceHours)->isFuture()) {
            Log::warning('2FA grace-period active for privileged user', [
                'user_id' => $user->id,
                'username' => $user->username,
                'roles' => $user->getRoleNames()->all(),
                'account_age_minutes' => $user->created_at->diffInMinutes(now()),
                'grace_hours' => $graceHours,
                'route' => $request->route()?->getName(),
            ]);

            return $next($request);
        }

        // Always allow the onboarding endpoints, even outside grace.
        $routeName = (string) $request->route()?->getName();
        if (in_array($routeName, self::ONBOARDING_ROUTES, true)) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'error' => [
                'code' => 'TWO_FACTOR_SETUP_REQUIRED',
                'message' => 'Akun Anda wajib mengaktifkan 2FA sebelum melanjutkan. Silakan buka halaman Profil → Keamanan untuk memindai QR code.',
                'setup_url' => '/admin/pengaturan/keamanan',
            ],
        ], 403);
    }
}
