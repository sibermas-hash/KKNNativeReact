<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;
use PDO;

abstract class TestCase extends BaseTestCase
{
    protected function beforeRefreshingDatabase()
    {
        $this->ensurePostgresTestDatabaseExists();
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();

        $this->ensurePostgresTestDatabaseExists();
        $this->shareTestingConnections();
    }

    private function ensurePostgresTestDatabaseExists(): void
    {
        if (! app()->environment('testing') || config('database.default') !== 'pgsql') {
            return;
        }

        $database = (string) config('database.connections.pgsql.database');
        $host = (string) config('database.connections.pgsql.host');
        $port = (string) config('database.connections.pgsql.port');
        $username = (string) config('database.connections.pgsql.username');
        $password = (string) config('database.connections.pgsql.password');

        if ($database === '' || $host === '' || $port === '' || $username === '') {
            return;
        }

        $adminDsn = sprintf('pgsql:host=%s;port=%s;dbname=%s', $host, $port, 'postgres');
        $adminPdo = new PDO($adminDsn, $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ]);

        $statement = $adminPdo->prepare('SELECT 1 FROM pg_database WHERE datname = ?');
        $statement->execute([$database]);
        $exists = (bool) $statement->fetchColumn();

        if (! $exists) {
            $quotedDatabase = str_replace('"', '""', $database);
            $adminPdo->exec(sprintf('CREATE DATABASE "%s"', $quotedDatabase));
        }
    }

    private function shareTestingConnections(): void
    {
        if (! app()->environment('testing')) {
            return;
        }

        $defaultConnectionName = config('database.default');
        $defaultConnection = DB::connection($defaultConnectionName);
        $defaultConfig = (array) config("database.connections.{$defaultConnectionName}");
        $defaultPdo = $defaultConnection->getPdo();

        foreach (['kkn', 'master'] as $connectionName) {
            if ($connectionName === $defaultConnectionName) {
                continue;
            }

            $connectionConfig = (array) config("database.connections.{$connectionName}");

            if (! $this->shouldShareConnection($defaultConfig, $connectionConfig)) {
                continue;
            }

            DB::connection($connectionName)->setPdo($defaultPdo);
            DB::connection($connectionName)->setReadPdo($defaultPdo);
        }
    }

    private function shouldShareConnection(array $defaultConfig, array $connectionConfig): bool
    {
        $defaultDriver = $defaultConfig['driver'] ?? null;
        $connectionDriver = $connectionConfig['driver'] ?? null;

        if ($defaultDriver !== 'pgsql' || $connectionDriver !== 'pgsql') {
            return false;
        }

        return ($defaultConfig['host'] ?? null) === ($connectionConfig['host'] ?? null)
            && (string) ($defaultConfig['port'] ?? null) === (string) ($connectionConfig['port'] ?? null)
            && ($defaultConfig['database'] ?? null) === ($connectionConfig['database'] ?? null)
            && ($defaultConfig['username'] ?? null) === ($connectionConfig['username'] ?? null);
    }
}
