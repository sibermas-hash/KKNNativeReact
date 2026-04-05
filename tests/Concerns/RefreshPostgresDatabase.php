<?php

namespace Tests\Concerns;

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Testing\RefreshDatabase as LaravelRefreshDatabase;
use Illuminate\Support\Facades\DB;

trait RefreshPostgresDatabase
{
    use LaravelRefreshDatabase;

    protected function migrateDatabases()
    {
        $connectionName = (string) config('database.default');
        $connectionConfig = (array) config("database.connections.{$connectionName}");

        if (($connectionConfig['driver'] ?? null) === 'pgsql') {
            $this->artisan('db:wipe', [
                '--database' => $connectionName,
                '--drop-views' => true,
                '--drop-types' => true,
            ]);

            $this->app[Kernel::class]->setArtisan(null);

            $parameters = $this->seeder()
                ? ['--seeder' => $this->seeder()]
                : ['--seed' => $this->shouldSeed()];

            $this->artisan('migrate', $parameters);
            $this->app[Kernel::class]->setArtisan(null);

            return;
        }

        $this->artisan('migrate:fresh', $this->migrateFreshUsing());
    }

    protected function afterRefreshingDatabase()
    {
        $this->shareTestingConnections();
    }

    protected function connectionsToTransact()
    {
        return [config('database.default')];
    }

    private function shouldShareTestingConnection(array $defaultConfig, array $connectionConfig): bool
    {
        if (($defaultConfig['driver'] ?? null) !== 'pgsql' || ($connectionConfig['driver'] ?? null) !== 'pgsql') {
            return false;
        }

        return ($defaultConfig['host'] ?? null) === ($connectionConfig['host'] ?? null)
            && (string) ($defaultConfig['port'] ?? null) === (string) ($connectionConfig['port'] ?? null)
            && ($defaultConfig['database'] ?? null) === ($connectionConfig['database'] ?? null)
            && ($defaultConfig['username'] ?? null) === ($connectionConfig['username'] ?? null);
    }

    private function shareTestingConnections(): void
    {
        if (! app()->environment('testing')) {
            return;
        }

        $defaultConnectionName = (string) config('database.default');
        $defaultConnection = DB::connection($defaultConnectionName);
        $defaultConfig = (array) config("database.connections.{$defaultConnectionName}");
        $defaultPdo = $defaultConnection->getPdo();

        foreach (['pgsql', 'kkn', 'master'] as $connectionName) {
            if ($connectionName === $defaultConnectionName) {
                continue;
            }

            $connectionConfig = (array) config("database.connections.{$connectionName}");

            if (! $this->shouldShareTestingConnection($defaultConfig, $connectionConfig)) {
                continue;
            }

            $connection = DB::connection($connectionName);
            $connection->setPdo($defaultPdo);
            $connection->setReadPdo($defaultPdo);
        }
    }
}
