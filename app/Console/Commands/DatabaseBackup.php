<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;

class DatabaseBackup extends Command
{
    protected $signature = 'db:backup
                            {--keep=7 : Number of days to keep backups}
                            {--disk=local : Storage disk to use}';

    protected $description = 'Backup PostgreSQL database using pg_dump';

    public function handle(): int
    {
        $this->info('Starting database backup...');

        $connection = config('database.default');
        $config = config("database.connections.{$connection}", []);
        $driver = $config['driver'] ?? null;

        if ($driver !== 'pgsql') {
            $this->error("Driver '{$driver}' tidak didukung. Hanya PostgreSQL yang didukung.");

            return self::FAILURE;
        }

        $database = $config['database'] ?? '';
        $host = $config['host'] ?? '127.0.0.1';
        $port = $config['port'] ?? '5432';
        $username = $config['username'] ?? '';
        $password = $config['password'] ?? '';

        $timestamp = now()->format('Y-m-d_His');
        $filename = "backup_{$database}_{$timestamp}.sql.gz";
        $disk = $this->option('disk');

        $this->info("Database: {$database} @ {$host}:{$port}");
        $this->info("Output: {$filename}");

        try {
            // Ensure backup directory exists
            $backupDir = storage_path('app/backups');
            if (! is_dir($backupDir)) {
                mkdir($backupDir, 0755, true);
            }

            $outputPath = "{$backupDir}/{$filename}";

            // Build pg_dump command
            $command = sprintf(
                'PGPASSWORD=%s pg_dump -h %s -p %s -U %s -Fc --no-owner --no-acl %s | gzip > %s',
                escapeshellarg($password),
                escapeshellarg($host),
                escapeshellarg($port),
                escapeshellarg($username),
                escapeshellarg($database),
                escapeshellarg($outputPath),
            );

            $result = Process::timeout(600)->run($command);

            if ($result->failed()) {
                $this->error('pg_dump failed: ' . $result->errorOutput());

                return self::FAILURE;
            }

            // Check file was created and has content
            if (! file_exists($outputPath) || filesize($outputPath) < 100) {
                $this->error('Backup file kosong atau tidak terbuat.');

                return self::FAILURE;
            }

            $sizeKb = round(filesize($outputPath) / 1024, 1);
            $this->info("✅ Backup berhasil: {$filename} ({$sizeKb} KB)");

            // Clean up old backups
            $this->cleanOldBackups($backupDir, (int) $this->option('keep'));

            return self::SUCCESS;

        } catch (\Throwable $e) {
            $this->error('Backup gagal: ' . $e->getMessage());

            return self::FAILURE;
        }
    }

    private function cleanOldBackups(string $dir, int $keepDays): void
    {
        $cutoff = now()->subDays($keepDays)->timestamp;
        $deleted = 0;

        foreach (glob("{$dir}/backup_*.sql.gz") as $file) {
            if (filemtime($file) < $cutoff) {
                unlink($file);
                $deleted++;
            }
        }

        if ($deleted > 0) {
            $this->info("🗑️ {$deleted} backup lama (>{$keepDays} hari) dihapus.");
        }
    }
}
