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
        \Illuminate\Support\Facades\Gate::before(function ($user, $ability) {
            if ($user->hasRole('Admin') || $user->hasRole('superadmin')) {
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

        // Register Observers for critical models
        \App\Models\KKN\NilaiKkn::observe(\App\Observers\AuditObserver::class);
        \App\Models\KKN\Laporan::observe(\App\Observers\AuditObserver::class);
        \App\Models\KKN\KegiatanKkn::observe(\App\Observers\AuditObserver::class);
        \App\Models\KKN\Mahasiswa::observe(\App\Observers\AuditObserver::class);
        \App\Models\KKN\Evaluasi::observe(\App\Observers\AuditObserver::class);
        \App\Models\KKN\KonfigurasiSertifikat::observe(\App\Observers\AuditObserver::class);

        // Force HTTPS when behind Cloudflare tunnel
        if ($this->app->environment('production')) {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }
    }
}