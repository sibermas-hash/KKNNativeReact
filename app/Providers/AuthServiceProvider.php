<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        \App\Models\KKN\NilaiKkn::class => \App\Policies\KknScorePolicy::class,
        \App\Models\KKN\LogAudit::class => \App\Policies\AuditLogPolicy::class,
        \App\Models\KKN\Proposal::class => \App\Policies\ProposalPolicy::class,
        \App\Models\KKN\Periode::class => \App\Policies\PeriodPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Implicit grant "Super Admin" all permissions
        Gate::before(function ($user, $ability) {
            if ($user->hasRole('superadmin')) {
                // Log non-read actions for accountability
                if (!str_starts_with($ability, 'view') && !str_starts_with($ability, 'access')) {
                    \App\Services\AuditService::logGodModeAccess($user, $ability);
                }
                return true;
            }
            return null;
        });

        // Define dashboard access gates
        Gate::define('access-admin-panel', fn($user) => $user->hasAnyRole(['superadmin', 'admin']));
        Gate::define('access-dpl-panel', fn($user) => $user->hasRole('dpl'));
        Gate::define('access-student-panel', fn($user) => $user->hasRole('student'));
    }
}
