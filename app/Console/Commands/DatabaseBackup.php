<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class DatabaseBackup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:backup 
                            {--keep=7 : Number of days to keep backups}
                            {--disk=local : Storage disk to use}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Backup database to storage';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting database backup...');

        // Get database connection info
        $connection = config('database.default');
        $connectionConfig = config("database.connections.{$connection}", []);
        $driver = $connectionConfig['driver'] ?? null;
        $database = $connectionConfig['database'] ?? null;

        $this->info("Connection: {$connection}");
        $this->info("Database: {$database}");

        try {
            if ($driver !== 'pgsql') {
                $this->warn("Driver {$driver} tidak didukung. Proyek ini sekarang hanya mendukung backup PostgreSQL.");
                return 1;
            }

            $this->warn('Backup otomatis PostgreSQL belum diimplementasikan tanpa utilitas pg_dump.');
            $this->warn('Gunakan backup operasional PostgreSQL dari server atau pipeline infrastruktur.');
            return 1;

        } catch (\Exception $e) {
            $this->error("Backup failed: " . $e->getMessage());
            return 1;
        }
    }
}
