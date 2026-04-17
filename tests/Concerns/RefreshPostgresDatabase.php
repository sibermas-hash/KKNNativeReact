<?php

namespace Tests\Concerns;

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Database\QueryException;
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
            try {
                $this->ensurePostgresDatabaseExists($connectionConfig);
            } catch (\Throwable $e) {
                // Database likely already exists or maintenance DB is inaccessible
            }

            // Robustly wipe the PostgreSQL schema to avoid dependency issues (views, types, etc.)
            try {
                DB::connection($connectionName)->getPdo()->exec('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
            } catch (\Throwable $e) {
                // Schema reset failed, try plain migrate:fresh instead
                $this->artisan('migrate:fresh', ['--database' => $connectionName, '--force' => true, '--no-seed' => true]);
                $this->app[Kernel::class]->setArtisan(null);
                return;
            }

            $this->app[Kernel::class]->setArtisan(null);

            $this->runCuratedPostgresMigrations($connectionName);
            $this->app[Kernel::class]->setArtisan(null);

            // Share connections so seeders (triggered by TestCase or manually) use the same PDO
            $this->shareTestingConnections();

            return;
        }

        $this->artisan('migrate:fresh', $this->migrateFreshUsing());
    }

    protected function afterRefreshingDatabase()
    {
        $this->shareTestingConnections();

        // Our custom migration path bypasses migrate:fresh --seed,
        // so we must run the configured seeder ourselves.
        if ($this->shouldSeed()) {
            $seeder = $this->seeder();
            if ($seeder) {
                $this->artisan('db:seed', ['--class' => $seeder, '--no-interaction' => true]);
            } else {
                $this->artisan('db:seed', ['--no-interaction' => true]);
            }
            $this->app[\Illuminate\Contracts\Console\Kernel::class]->setArtisan(null);
        }
    }

    /**
     * Override to ensure PDO is shared before transactions start.
     */
    protected function beginDatabaseTransaction()
    {
        $this->shareTestingConnections();
        
        // Call the trait's beginDatabaseTransaction (from DatabaseTransactions/RefreshDatabase)
        // We can't use parent:: because it's a trait. 
        // We'll just implement the core logic here to be sure.
        
        $database = $this->app->make('db');

        foreach ($this->connectionsToTransact() as $name) {
            $connection = $database->connection($name);
            $dispatcher = $connection->getEventDispatcher();
            $connection->unsetEventDispatcher();
            $connection->beginTransaction();
            $connection->setEventDispatcher($dispatcher);
        }

        $this->beforeApplicationDestroyed(function () use ($database) {
            foreach ($this->connectionsToTransact() as $name) {
                $connection = $database->connection($name);
                $dispatcher = $connection->getEventDispatcher();
                $connection->unsetEventDispatcher();
                $connection->rollBack();
                $connection->setEventDispatcher($dispatcher);
                $connection->disconnect();
            }
        });
    }

    protected function connectionsToTransact()
    {
        // ONLY transact the default connection. 
        // Since pgsql, kkn, and master share the same PDO, 
        // transacting pgsql will transact ALL of them.
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

    private function ensurePostgresDatabaseExists(array $connectionConfig): void
    {
        $database = (string) ($connectionConfig['database'] ?? '');

        if ($database === '') {
            return;
        }

        foreach ($this->maintenanceDatabaseCandidates($connectionConfig) as $maintenanceDatabase) {
            try {
                $pdo = $this->makePostgresPdo($connectionConfig, $maintenanceDatabase);
                $statement = $pdo->prepare('SELECT 1 FROM pg_database WHERE datname = :database');
                $statement->execute(['database' => $database]);

                if (! $statement->fetchColumn()) {
                    $pdo->exec(sprintf('CREATE DATABASE "%s"', str_replace('"', '""', $database)));
                }

                return;
            } catch (\Throwable $e) {
                continue;
            }
        }

        throw new QueryException(
            'pgsql',
            'CREATE DATABASE',
            [],
            new \RuntimeException("Tidak dapat menyiapkan database uji PostgreSQL '{$database}'.")
        );
    }

    /**
     * @return list<string>
     */
    private function maintenanceDatabaseCandidates(array $connectionConfig): array
    {
        $targetDatabase = (string) ($connectionConfig['database'] ?? 'kkn_test');
        $baseDatabase = preg_replace('/_test$/', '', $targetDatabase) ?: 'kkn';

        return array_values(array_unique(array_filter([
            'postgres',
            $baseDatabase,
            'template1',
        ])));
    }

    private function makePostgresPdo(array $connectionConfig, string $database): \PDO
    {
        $host = (string) ($connectionConfig['host'] ?? '127.0.0.1');
        $port = (string) ($connectionConfig['port'] ?? '5432');
        $username = (string) ($connectionConfig['username'] ?? '');
        $password = (string) ($connectionConfig['password'] ?? '');
        $sslmode = (string) ($connectionConfig['sslmode'] ?? 'prefer');

        return new \PDO(
            "pgsql:host={$host};port={$port};dbname={$database};sslmode={$sslmode}",
            $username,
            $password,
            [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
            ]
        );
    }

    private function runCuratedPostgresMigrations(string $connectionName): void
    {
        foreach ($this->orderedMigrationPaths() as $path) {
            $this->artisan('migrate', [
                '--database' => $connectionName,
                '--path' => $path,
                '--realpath' => true,
                '--force' => true,
            ]);
            $this->app[Kernel::class]->setArtisan(null);
        }
    }

    /**
     * @return list<string>
     */
    private function orderedMigrationPaths(): array
    {
        $allPaths = collect(glob(database_path('migrations/*.php')) ?: [])
            ->sort()
            ->values();

        $prioritized = [
            '0001_01_01_000000_create_users_table.php',
            '0001_01_01_000001_create_cache_table.php',
            '0001_01_01_000002_create_jobs_table.php',
            '2026_02_06_180348_create_personal_access_tokens_table.php',
            '2026_02_06_180353_create_permission_tables.php',
            '2026_02_06_183854_create_telescope_entries_table.php',
            '2026_04_12_000010_create_kkn_core_tables.php',
        ];

        $priorityPaths = collect($prioritized)
            ->map(fn (string $file) => database_path("migrations/{$file}"))
            ->filter(fn (string $path) => file_exists($path));

        return $priorityPaths
            ->merge($allPaths->reject(fn (string $path) => in_array(basename($path), $prioritized, true)))
            ->values()
            ->all();
    }
}
