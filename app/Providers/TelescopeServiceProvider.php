<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

// Safe guard: when Telescope package not installed (production without dev deps), provide no-op provider.
if (! class_exists(\Laravel\Telescope\TelescopeApplicationServiceProvider::class)) {
    class TelescopeServiceProvider extends ServiceProvider
    {
        public function register(): void {}
        public function boot(): void {}
    }
    return;
}

use Laravel\Telescope\IncomingEntry;
use Laravel\Telescope\Telescope;
use Laravel\Telescope\TelescopeApplicationServiceProvider;

class TelescopeServiceProvider extends TelescopeApplicationServiceProvider
{
    private static ?bool $storageAvailable = null;

    /**
     * Register any application services.
     */
    public function register(): void
    {
        if (! $this->shouldRecordTelescopeEntries()) {
            config(['telescope.enabled' => false]);

            return;
        }

        // Telescope::night();

        $this->hideSensitiveRequestDetails();

        $isLocal = $this->app->environment('local');

        Telescope::filter(function (IncomingEntry $entry) use ($isLocal) {
            return $isLocal ||
                   $entry->isReportableException() ||
                   $entry->isFailedRequest() ||
                   $entry->isFailedJob() ||
                   $entry->isScheduledTask() ||
                   $entry->hasMonitoredTag();
        });
    }

    private function shouldRecordTelescopeEntries(): bool
    {
        if (! config('telescope.enabled', true)) {
            return false;
        }

        if (self::$storageAvailable !== null) {
            return self::$storageAvailable;
        }

        try {
            $connection = config('telescope.storage.database.connection');

            return self::$storageAvailable = Schema::connection($connection)->hasTable('telescope_entries');
        } catch (\Throwable) {
            return self::$storageAvailable = false;
        }
    }

    /**
     * Prevent sensitive request details from being logged by Telescope.
     */
    protected function hideSensitiveRequestDetails(): void
    {
        if ($this->app->environment('local')) {
            return;
        }

        Telescope::hideRequestParameters(['_token']);

        Telescope::hideRequestHeaders([
            'cookie',
            'x-csrf-token',
            'x-xsrf-token',
        ]);
    }

    /**
     * Register the Telescope gate.
     *
     * This gate determines who can access Telescope in non-local environments.
     */
    protected function gate(): void
    {
        Gate::define('viewTelescope', function (User $user) {
            return in_array($user->email, [
                //
            ]);
        });
    }
}
