<?php

namespace App\Providers;

use App\Repositories\Contracts\RegistrationRepositoryInterface;
use App\Repositories\Eloquent\RegistrationRepository;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(RegistrationRepositoryInterface::class , RegistrationRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // 1. Unified Authorization Gates (from AuthServiceProvider)
        \Illuminate\Support\Facades\Gate::before(function ($user, $ability) {
            if ($user->hasRole('admin') || $user->hasRole('superadmin')) {
                // Auto-bypass for read/view abilities only
                $readOnlyAbilities = ['viewAny', 'view', 'export', 'viewInertia'];
                if (in_array($ability, $readOnlyAbilities)) {
                    return true;
                }

                // Log sensitive interventions (mutations)
                \App\Services\AuditService::logGodModeAccess($user, $ability);

                // Mutation abilities pass through to policies for proper checks
                return null;
            }

            return null;
        });

        // Dashboard access gates
        \Illuminate\Support\Facades\Gate::define('access-admin-panel', fn($user) => $user->hasAnyRole(['superadmin', 'admin', 'faculty_admin']));
        \Illuminate\Support\Facades\Gate::define('access-dpl-panel', fn($user) => $user->hasRole('dpl'));
        \Illuminate\Support\Facades\Gate::define('access-student-panel', fn($user) => $user->hasRole('student'));
        \Illuminate\Support\Facades\Gate::define('view-reports', fn($user) => $user->hasAnyRole(['superadmin', 'admin', 'faculty_admin', 'dpl']));

        // Admin operation gates
        $adminPolicy = new \App\Policies\AdminOperationPolicy;
        \Illuminate\Support\Facades\Gate::define('manage-master-data', fn($user) => $adminPolicy->manageMasterData($user));
        \Illuminate\Support\Facades\Gate::define('manage-groups', fn($user) => $adminPolicy->manageGroups($user));
        \Illuminate\Support\Facades\Gate::define('manage-settings', fn($user) => $adminPolicy->manageSettings($user));
        \Illuminate\Support\Facades\Gate::define('sync-data', fn($user) => $adminPolicy->syncData($user));
        \Illuminate\Support\Facades\Gate::define('manageDplAssignment', fn($user) => $adminPolicy->manageDplAssignment($user));
        \Illuminate\Support\Facades\Gate::define('manage-participants', fn($user) => $adminPolicy->manageParticipants($user));
        \Illuminate\Support\Facades\Gate::define('transfer-students', fn($user) => $adminPolicy->transferStudents($user));
        \Illuminate\Support\Facades\Gate::define('manage-users', fn($user) => $adminPolicy->manageUsers($user));
        \Illuminate\Support\Facades\Gate::define('manage-grades', fn($user) => $adminPolicy->manageGrades($user));
        \Illuminate\Support\Facades\Gate::define('manage-content', fn($user) => $adminPolicy->manageContent($user));
        \Illuminate\Support\Facades\Gate::define('view-audit-logs', fn($user) => $adminPolicy->viewAuditLogs($user));
        \Illuminate\Support\Facades\Gate::define('manage-dpl', fn($user) => $adminPolicy->manageDplAssignment($user));
        \Illuminate\Support\Facades\Gate::define('manage-reports', fn($user) => $adminPolicy->manageReports($user));
        \Illuminate\Support\Facades\Gate::define('manage-kkn-operations', fn($user) => $adminPolicy->manageKknOperations($user));
        \Illuminate\Support\Facades\Gate::define('manage-eligibility', fn($user) => $adminPolicy->manageEligibility($user));
        \Illuminate\Support\Facades\Gate::define('manage-requirements', fn($user) => $adminPolicy->manageRequirements($user));
        \Illuminate\Support\Facades\Gate::define('manage-workshops', fn($user) => $adminPolicy->manageWorkshops($user));
        \Illuminate\Support\Facades\Gate::define('manage-database-sync', fn($user) => $adminPolicy->manageDatabaseSync($user));

        // 2. Event Listeners (from EventServiceProvider)
        \Illuminate\Support\Facades\Event::listen(
            \Illuminate\Auth\Events\Registered::class,
            [\Illuminate\Auth\Listeners\SendEmailVerificationNotification::class, 'handle']
        );

        // 3. Model Observers
        if (class_exists('App\Models\KKN\NilaiKkn')) {
            \App\Models\KKN\NilaiKkn::observe(\App\Observers\AuditObserver::class);
        }
        if (class_exists('App\Models\KKN\Laporan')) {
            \App\Models\KKN\Laporan::observe(\App\Observers\AuditObserver::class);
        }
        if (class_exists('App\Models\KKN\KegiatanKkn')) {
            \App\Models\KKN\KegiatanKkn::observe(\App\Observers\AuditObserver::class);
        }
        if (class_exists('App\Models\KKN\Mahasiswa')) {
            \App\Models\KKN\Mahasiswa::observe(\App\Observers\AuditObserver::class);
        }
        if (class_exists('App\Models\KKN\Evaluasi')) {
            \App\Models\KKN\Evaluasi::observe(\App\Observers\AuditObserver::class);
        }
        if (class_exists('App\Models\KKN\KonfigurasiSertifikat')) {
            \App\Models\KKN\KonfigurasiSertifikat::observe(\App\Observers\AuditObserver::class);
        }

        // 4. Global URL Scheme
        if ($this->app->environment('production')) {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }

    }
}