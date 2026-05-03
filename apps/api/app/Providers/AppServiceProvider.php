<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\KKN\Evaluasi;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KonfigurasiSertifikat;
use App\Models\KKN\Laporan;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\SystemSetting;
use App\Observers\AuditObserver;
use App\Policies\AdminOperationPolicy;
use App\Policies\KknScorePolicy;
use App\Repositories\Contracts\RegistrationRepositoryInterface;
use App\Repositories\Eloquent\RegistrationRepository;
use App\Services\AuditService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(RegistrationRepositoryInterface::class, RegistrationRepository::class);

        Gate::policy(NilaiKkn::class, KknScorePolicy::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->applyMasterApiRuntimeOverrides();

        // 1. Unified Authorization Gates (from AuthServiceProvider)
        Gate::before(function ($user, $ability) {
            if ($user->hasRole('admin') || $user->hasRole('superadmin')) {
                // Auto-bypass for read/view abilities only
                $readOnlyAbilities = ['viewAny', 'view', 'export', 'viewInertia'];
                if (in_array($ability, $readOnlyAbilities)) {
                    return true;
                }

                // Log sensitive interventions (mutations)
                AuditService::logGodModeAccess($user, $ability);

                // Mutation abilities pass through to policies for proper checks
                return null;
            }

            return null;
        });

        // Dashboard access gates
        Gate::define('access-admin-panel', fn ($user) => $user->hasAnyRole(['superadmin', 'admin', 'faculty_admin']));
        Gate::define('access-dosen-panel', fn ($user) => $user->hasAnyRole(['dosen', 'dpl']));
        Gate::define('access-dpl-panel', fn ($user) => $user->hasRole('dpl'));
        Gate::define('access-student-panel', fn ($user) => $user->hasRole('student'));
        Gate::define('view-reports', fn ($user) => $user->hasAnyRole(['superadmin', 'admin', 'faculty_admin', 'dpl']));

        // Admin operation gates
        $adminPolicy = new AdminOperationPolicy;
        Gate::define('manage-master-data', fn ($user) => $adminPolicy->manageMasterData($user));
        Gate::define('manage-groups', fn ($user) => $adminPolicy->manageGroups($user));
        Gate::define('manage-settings', fn ($user) => $adminPolicy->manageSettings($user));
        Gate::define('sync-data', fn ($user) => $adminPolicy->syncData($user));
        Gate::define('manageDplAssignment', fn ($user) => $adminPolicy->manageDplAssignment($user));
        Gate::define('manage-participants', fn ($user) => $adminPolicy->manageParticipants($user));
        Gate::define('transfer-students', fn ($user) => $adminPolicy->transferStudents($user));
        Gate::define('manage-users', fn ($user) => $adminPolicy->manageUsers($user));
        Gate::define('manage-grades', fn ($user) => $adminPolicy->manageGrades($user));
        Gate::define('manage-content', fn ($user) => $adminPolicy->manageContent($user));
        Gate::define('view-audit-logs', fn ($user) => $adminPolicy->viewAuditLogs($user));
        Gate::define('manage-dpl', fn ($user) => $adminPolicy->manageDplAssignment($user));
        Gate::define('manage-reports', fn ($user) => $adminPolicy->manageReports($user));
        Gate::define('manage-kkn-operations', fn ($user) => $adminPolicy->manageKknOperations($user));
        Gate::define('manage-eligibility', fn ($user) => $adminPolicy->manageEligibility($user));
        Gate::define('manage-requirements', fn ($user) => $adminPolicy->manageRequirements($user));
        Gate::define('manage-workshops', fn ($user) => $adminPolicy->manageWorkshops($user));
        Gate::define('manage-database-sync', fn ($user) => $adminPolicy->manageDatabaseSync($user));

        // 2. Event Listeners (from EventServiceProvider)
        Event::listen(
            Registered::class,
            [SendEmailVerificationNotification::class, 'handle']
        );

        // 3. Model Observers
        if (class_exists('App\Models\KKN\NilaiKkn')) {
            NilaiKkn::observe(AuditObserver::class);
        }
        if (class_exists('App\Models\KKN\Laporan')) {
            Laporan::observe(AuditObserver::class);
        }
        if (class_exists('App\Models\KKN\KegiatanKkn')) {
            KegiatanKkn::observe(AuditObserver::class);
        }
        if (class_exists('App\Models\KKN\Mahasiswa')) {
            Mahasiswa::observe(AuditObserver::class);
        }
        if (class_exists('App\Models\KKN\Evaluasi')) {
            Evaluasi::observe(AuditObserver::class);
        }
        if (class_exists('App\Models\KKN\KonfigurasiSertifikat')) {
            KonfigurasiSertifikat::observe(AuditObserver::class);
        }

        // 4. Global URL Scheme
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

    }

    private function applyMasterApiRuntimeOverrides(): void
    {
        $settingsMap = [
            'services.master_api.url' => 'master_api_url',
            'services.master_api.client_id' => 'master_api_client_id',
            'services.master_api.client_secret' => 'master_api_client_secret',
            'services.master_api.token' => 'master_api_token',
        ];

        $overrides = [];

        foreach ($settingsMap as $configKey => $settingKey) {
            $value = SystemSetting::get($settingKey);

            if ($value !== null && $value !== '') {
                $overrides[$configKey] = $value;
            }
        }

        if ($overrides !== []) {
            config($overrides);
        }
    }
}
