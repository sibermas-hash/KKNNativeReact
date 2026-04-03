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
        \App\Models\KKN\NilaiKkn::class => \App\Policies\KknScorePolicy::class ,
        \App\Models\KKN\LogAudit::class => \App\Policies\AuditLogPolicy::class ,
        \App\Models\KKN\Periode::class => \App\Policies\PeriodPolicy::class ,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Gate::before is defined in AppServiceProvider to avoid duplicate callbacks.

        // Define dashboard access gates
        Gate::define('access-admin-panel', fn($user) => $user->hasAnyRole(['superadmin', 'faculty_admin']));
        Gate::define('access-dpl-panel', fn($user) => $user->hasRole('dpl'));
        Gate::define('access-student-panel', fn($user) => $user->hasRole('student'));

        // Admin operation gates (defense-in-depth beyond route middleware)
        $adminPolicy = new \App\Policies\AdminOperationPolicy;
        Gate::define('manage-master-data', fn($user) => $adminPolicy->manageMasterData($user));
        Gate::define('manage-groups', fn($user) => $adminPolicy->manageGroups($user));
        Gate::define('manage-settings', fn($user) => $adminPolicy->manageSettings($user));
        Gate::define('sync-data', fn($user) => $adminPolicy->syncData($user));
        Gate::define('transfer-students', fn($user) => $adminPolicy->transferStudents($user));
    }
}
