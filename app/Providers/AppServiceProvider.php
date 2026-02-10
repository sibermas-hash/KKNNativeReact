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
        $this->app->bind(RegistrationRepositoryInterface::class, RegistrationRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \Illuminate\Support\Facades\Gate::before(function ($user, $ability) {
            if ($user->hasRole('admin')) {
                // Only log bypass for sensitive/mutation abilities to reduce noise
                $sensitiveAbilities = ['create', 'update', 'delete', 'finalize', 'bulkFinalize', 'export'];
                
                if (in_array($ability, $sensitiveAbilities)) {
                    \App\Models\AuditLog::create([
                        'user_id' => $user->id,
                        'action' => 'GATE_BYPASS',
                        'ability' => $ability,
                        'description' => "Admin bypassed policy for ability: {$ability}",
                        'ip_address' => request()->ip(),
                        'user_agent' => request()->userAgent(),
                    ]);
                }
                
                return true;
            }
            return null;
        });

        // Register Observers for critical models
        \App\Models\KknScore::observe(\App\Observers\AuditObserver::class);
        \App\Models\Report::observe(\App\Observers\AuditObserver::class);
        \App\Models\DailyReport::observe(\App\Observers\AuditObserver::class);
    }
}
