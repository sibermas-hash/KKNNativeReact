<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\KKN\Evaluasi;
use App\Models\KKN\IzinMeninggalkan;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KonfigurasiSertifikat;
use App\Models\KKN\Laporan;
use App\Models\KKN\LogAudit;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\SystemSetting;
use App\Observers\AuditObserver;
use App\Policies\AdminOperationPolicy;
use App\Policies\AuditLogPolicy;
use App\Policies\EvaluasiPolicy;
use App\Policies\IzinPolicy;
use App\Policies\KegiatanKknPolicy;
use App\Policies\KknScorePolicy;
use App\Policies\PeriodPolicy;
use App\Repositories\Contracts\RegistrationRepositoryInterface;
use App\Repositories\Eloquent\RegistrationRepository;
use App\Services\AuditService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
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

        // H-005 fix (re-audit 2026-05-10): Laravel policy auto-discovery
        // expects policy class at `App\Policies\{Model}Policy`, but models
        // under `App\Models\KKN\` don't follow that flat namespace convention.
        // Register these explicitly so `Gate::authorize(...)` lookups resolve.
        Gate::policy(KegiatanKkn::class, KegiatanKknPolicy::class);
        Gate::policy(Evaluasi::class, EvaluasiPolicy::class);
        Gate::policy(Periode::class, PeriodPolicy::class);
        Gate::policy(IzinMeninggalkan::class, IzinPolicy::class);
        Gate::policy(LogAudit::class, AuditLogPolicy::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->applyMasterApiRuntimeOverrides();

        // 1. Unified Authorization Gates (from AuthServiceProvider)
        Gate::before(function ($user, $ability) {
            // Only superadmin gets blanket bypass (god mode).
            // Regular admin must go through policies for proper faculty scoping.
            if ($user->hasRole('superadmin')) {
                return true;
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
        Gate::define('view-participants', fn ($user) => $adminPolicy->viewParticipants($user));
        Gate::define('transfer-students', fn ($user) => $adminPolicy->transferStudents($user));
        Gate::define('manage-users', fn ($user) => $adminPolicy->manageUsers($user));
        Gate::define('manage-grades', fn ($user) => $adminPolicy->manageGrades($user));
        Gate::define('view-grades', fn ($user) => $adminPolicy->viewGrades($user));
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

        // Queue failed job → AI Telegram alert
        Event::listen(\Illuminate\Queue\Events\JobFailed::class, function ($event) {
            try {
                app(\App\Services\AI\ErrorAlertService::class)->alertJobFailed(
                    $event->job->resolveName(),
                    $event->exception->getMessage(),
                    $event->job->getQueue(),
                );
            } catch (\Throwable) {
                // Alert failure must never break queue processing
            }
        });

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
        // Audit coverage expansion (R11-DB-013 mitigation): KonfigurasiPenilaian
        // (bobot grading) dan PesertaKkn (perubahan role ketua) adalah dua
        // model berikutnya yang paling fraud-sensitive. Audit trail lebih
        // tepat untuk data akademik daripada enkripsi kolom skor (yang akan
        // break semua SQL aggregate + grade distribution reports).
        if (class_exists('App\Models\KKN\KonfigurasiPenilaian')) {
            \App\Models\KKN\KonfigurasiPenilaian::observe(AuditObserver::class);
        }
        if (class_exists('App\Models\KKN\PesertaKkn')) {
            \App\Models\KKN\PesertaKkn::observe(AuditObserver::class);
        }

        // 4. Global URL Scheme
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        // 5. H-011: CORS runtime guard for production.
        // supports_credentials=true combined with a wildcard or localhost origin
        // is a configuration catastrophe. Fail fast at boot to prevent misconfig.
        $this->assertSafeCorsInProduction();

        // 6. Named rate limiters per-tier (roadmap §3.4).
        // These are opt-in via `throttle:<name>` on any route. The existing
        // per-route `throttle:60,1` style still works for backward compat.
        $this->registerTieredRateLimiters();
    }

    /**
     * Tier structure (per-minute):
     *   public         → 30 req (guest/IP-based)
     *   auth_challenge → 10 req (login, password reset — brute-force surface)
     *   authenticated  → role-scaled (superadmin unlimited, admin/faculty_admin 120,
     *                    dpl/dosen 60, student 60, guest 30)
     *   bulk           → 5  req  (destructive bulk endpoints)
     *   file_upload    → 10 req (multipart/form-data uploads)
     *
     * The 429 response already uses the global JSON envelope (RATE_LIMITED
     * code) via `bootstrap/app.php`'s ThrottleRequestsException renderer.
     * Laravel automatically emits X-RateLimit-Limit, X-RateLimit-Remaining,
     * and Retry-After headers on every rate-limited response.
     */
    private function registerTieredRateLimiters(): void
    {
        // Guest / public — anonymous read endpoints keyed by IP.
        RateLimiter::for('public', function (Request $request) {
            return Limit::perMinute(30)->by($request->ip());
        });

        // Auth challenge — login, password reset, captcha. Very tight because
        // this is the brute-force attack surface. IP-based to avoid account
        // enumeration side-channels.
        RateLimiter::for('auth_challenge', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        // Authenticated — per-user, scaled by role. Key is user id so that
        // multiple users behind the same NAT/office proxy don't throttle
        // each other.
        RateLimiter::for('authenticated', function (Request $request) {
            $user = $request->user();

            if (! $user) {
                // Fallback for routes that accidentally end up here without
                // auth (shouldn't happen, but a safe default). Treat as guest.
                return Limit::perMinute(30)->by('guest:'.$request->ip());
            }

            $key = 'user:'.$user->id;

            // Superadmin: unlimited (explicit — they run bulk ops that
            // legitimately burst traffic).
            if ($user->hasRole('superadmin')) {
                return Limit::none();
            }

            if ($user->hasAnyRole(['admin', 'faculty_admin'])) {
                return Limit::perMinute(120)->by($key);
            }

            if ($user->hasAnyRole(['dpl', 'dosen'])) {
                return Limit::perMinute(60)->by($key);
            }

            if ($user->hasRole('student')) {
                return Limit::perMinute(60)->by($key);
            }

            // Unknown role — treat as guest to avoid granting unintended
            // throughput to accounts with no role.
            return Limit::perMinute(30)->by($key);
        });

        // Destructive bulk operations (bulk-approve, mass-finalize, etc.).
        // Intentionally VERY tight — a slip-up here is expensive.
        RateLimiter::for('bulk', function (Request $request) {
            $user = $request->user();
            $key = $user ? ('user:'.$user->id) : ('ip:'.$request->ip());

            // Superadmin keeps a (still-bounded) higher allowance for legit
            // seasonal bulk work; others get 5/min.
            if ($user && $user->hasRole('superadmin')) {
                return Limit::perMinute(30)->by($key);
            }

            return Limit::perMinute(5)->by($key);
        });

        // Multipart uploads — proportional to server IO cost.
        RateLimiter::for('file_upload', function (Request $request) {
            $user = $request->user();
            $key = $user ? ('user:'.$user->id) : ('ip:'.$request->ip());

            if ($user && $user->hasRole('superadmin')) {
                return Limit::perMinute(60)->by($key);
            }

            return Limit::perMinute(10)->by($key);
        });
    }

    /**
     * H-011 fix. Verifies that in production the CORS origin list does not
     * include '*' or dev-only origins. Fails boot with a clear error otherwise.
     */
    private function assertSafeCorsInProduction(): void
    {
        if (! $this->app->environment('production')) {
            return;
        }

        $origins = array_map('trim', (array) config('cors.allowed_origins', []));
        $supportsCredentials = (bool) config('cors.supports_credentials', false);

        if (! $supportsCredentials) {
            return;
        }

        $forbidden = ['*', 'null', 'http://localhost', 'http://localhost:3000', 'http://localhost:8000', 'http://127.0.0.1', 'http://127.0.0.1:3000'];
        $bad = array_intersect($origins, $forbidden);

        if (! empty($bad)) {
            throw new \RuntimeException(
                'Unsafe CORS configuration detected in production. '.
                "Found forbidden origin(s) with supports_credentials=true: ".implode(', ', $bad).'. '.
                'Set CORS_ALLOWED_ORIGINS to an explicit list of production hosts only.'
            );
        }
    }

    private function applyMasterApiRuntimeOverrides(): void
    {
        $settingsMap = [
            'services.master_api.url' => 'master_api_url',
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
