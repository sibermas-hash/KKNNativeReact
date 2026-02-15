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
            // Superadmin bypasses everything (with audit logging)
            if ($user->hasRole('superadmin')) {
                \App\Services\AuditService::logGodModeAccess($user, $ability);
                return true;
            }

            // Admin: only auto-bypass for read/view abilities
            // Mutation abilities (create, update, delete, finalize, etc.) must pass through policies
            if ($user->hasRole('admin')) {
                $readOnlyAbilities = ['viewAny', 'view', 'export'];

                if (in_array($ability, $readOnlyAbilities)) {
                    return true;
                }

                // For mutation abilities, let the policy decide
                // Return null so the policy is evaluated normally
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