<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;
use ZipArchive;

/**
 * Disaster-recovery restore command.
 *
 * Audit follow-up: the old monolith had a RestoreFromBackupSeeder that only
 * worked with the Spatie backup archive format. That pattern is preserved
 * here as a first-class artisan command that uses the CURRENT stack:
 *
 *   - discovers archives via the backup disks configured in config/backup.php
 *   - extracts to a temp dir
 *   - restores files (storage/app) and the Postgres dump (via pg_restore)
 *
 * The command is DESTRUCTIVE. It refuses to run without:
 *   - `--force`
 *   - `APP_ENV != production` OR `--allow-production`
 *
 * Usage:
 *   php artisan backups:restore                      # lists available archives
 *   php artisan backups:restore --archive=foo.zip --force
 *   php artisan backups:restore --latest --force
 *
 * Note: files inside the archive are trusted implicitly. Only point this at
 * archives YOU produced with `php artisan backup:run`.
 */
class RestoreBackupCommand extends Command
{
    protected $signature = 'backups:restore
        {--disk= : Disk name from config/backup.php disks list (defaults to the first)}
        {--archive= : Specific archive filename to restore}
        {--latest : Restore the newest archive on the disk}
        {--files-only : Restore storage files only, skip the DB dump}
        {--db-only : Restore the DB dump only, skip storage files}
        {--force : Bypass interactive confirmation}
        {--allow-production : Required additionally when APP_ENV=production}';

    protected $description = 'Restore a Spatie-backup archive (DB + storage files). DESTRUCTIVE.';

    public function handle(): int
    {
        $disk = $this->option('disk') ?: ($this->resolveDefaultDisk());
        if (! $disk) {
            $this->error('No backup disks configured. Check config/backup.php.');
            return self::FAILURE;
        }

        $backupDisk = Storage::disk($disk);
        $archiveName = config('backup.backup.name', config('app.name'));
        $directory = $archiveName;

        // List mode (no archive chosen)
        if (! $this->option('archive') && ! $this->option('latest')) {
            $this->listArchives($backupDisk, $directory);
            return self::SUCCESS;
        }

        // Guardrails
        if (app()->environment('production') && ! $this->option('allow-production')) {
            $this->error('Refusing to run in production without --allow-production.');
            return self::FAILURE;
        }
        if (! $this->option('force') && ! $this->confirm(
            "This will OVERWRITE your database and storage files. Continue?",
            false
        )) {
            $this->info('Aborted.');
            return self::FAILURE;
        }

        // Pick archive
        $archive = $this->option('archive')
            ?: $this->findLatestArchive($backupDisk, $directory);
        if (! $archive) {
            $this->error('No archive found.');
            return self::FAILURE;
        }

        $remotePath = $directory.'/'.ltrim($archive, '/');
        if (! $backupDisk->exists($remotePath)) {
            $this->error("Archive not found on disk '{$disk}': {$remotePath}");
            return self::FAILURE;
        }

        $this->info("Restoring from: [{$disk}] {$remotePath}");

        // Download / stream to a local tempdir
        $tempRoot = storage_path('app/backup-restore/'.uniqid('restore_', true));
        if (! mkdir($tempRoot, 0700, true) && ! is_dir($tempRoot)) {
            $this->error("Cannot create temp dir {$tempRoot}");
            return self::FAILURE;
        }

        try {
            $localArchive = $tempRoot.'/archive.zip';
            file_put_contents($localArchive, $backupDisk->get($remotePath));

            $extractDir = $tempRoot.'/extracted';
            mkdir($extractDir, 0700, true);

            $zip = new ZipArchive;
            $openResult = $zip->open($localArchive, ZipArchive::RDONLY);
            if ($openResult !== true) {
                $this->error("Failed to open archive (code {$openResult}).");
                return self::FAILURE;
            }

            $password = config('backup.backup.password');
            if ($password) {
                $zip->setPassword((string) $password);
            }

            if (! $zip->extractTo($extractDir)) {
                $this->error('Failed to extract archive. Wrong BACKUP_ARCHIVE_PASSWORD?');
                return self::FAILURE;
            }
            $zip->close();

            if (! $this->option('db-only')) {
                $this->restoreFiles($extractDir);
            }

            if (! $this->option('files-only')) {
                $this->restoreDatabase($extractDir);
            }

            $this->info('Restore complete.');
            return self::SUCCESS;
        } finally {
            $this->cleanup($tempRoot);
        }
    }

    private function resolveDefaultDisk(): ?string
    {
        $disks = config('backup.backup.destination.disks', []);
        return $disks[0] ?? null;
    }

    private function listArchives($disk, string $directory): void
    {
        if (! $disk->exists($directory)) {
            $this->warn("Directory '{$directory}' not found on disk.");
            return;
        }

        $files = collect($disk->files($directory))
            ->filter(fn ($f) => str_ends_with($f, '.zip'))
            ->map(fn ($f) => [
                'name' => basename($f),
                'size_mb' => round($disk->size($f) / 1024 / 1024, 2),
                'modified' => date('Y-m-d H:i:s', $disk->lastModified($f)),
            ])
            ->sortByDesc('modified')
            ->values()
            ->toArray();

        if (empty($files)) {
            $this->warn("No .zip archives found in '{$directory}'.");
            return;
        }

        $this->table(['Archive', 'Size (MB)', 'Modified'], array_map(
            fn ($f) => [$f['name'], $f['size_mb'], $f['modified']],
            $files
        ));
        $this->info('Run with --latest or --archive=<name> plus --force to restore.');
    }

    private function findLatestArchive($disk, string $directory): ?string
    {
        $archives = collect($disk->files($directory))
            ->filter(fn ($f) => str_ends_with($f, '.zip'))
            ->sortByDesc(fn ($f) => $disk->lastModified($f))
            ->values();

        return $archives->first() ? basename($archives->first()) : null;
    }

    private function restoreFiles(string $extractDir): void
    {
        // Spatie produces "db-dumps/" and a top-level files tree (e.g. "var/www/...").
        // We recursively sync anything under the extracted tree that looks like
        // "storage/app" (relative to Laravel base_path) into the live storage.
        $this->info('Restoring storage files…');

        $pattern = '/(^|\/)storage\/app\/(?!backup-temp|backup-restore)(.*)$/';
        $restored = 0;
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($extractDir, \RecursiveDirectoryIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if (! $file->isFile()) {
                continue;
            }
            $relative = str_replace($extractDir.'/', '', $file->getPathname());
            if (! preg_match($pattern, $relative, $m)) {
                continue;
            }
            $target = storage_path('app/'.$m[2]);
            @mkdir(dirname($target), 0755, true);
            copy($file->getPathname(), $target);
            $restored++;
        }
        $this->info("Restored {$restored} file(s) into storage/app.");
    }

    private function restoreDatabase(string $extractDir): void
    {
        $dumps = glob($extractDir.'/db-dumps/*.sql') ?: [];
        if (empty($dumps)) {
            $dumps = glob($extractDir.'/db-dumps/*') ?: [];
        }
        $dump = $dumps[0] ?? null;
        if (! $dump) {
            $this->warn('No db-dump found in archive; skipping DB restore.');
            return;
        }

        $connection = config('database.default');
        $cfg = config("database.connections.{$connection}");

        if (($cfg['driver'] ?? null) !== 'pgsql') {
            $this->error("Only pgsql connections are supported by this command (saw '{$cfg['driver']}').");
            return;
        }

        $this->info("Restoring database '{$cfg['database']}' from {$dump}…");

        // Build psql/pg_restore invocation. We use psql for plain-text SQL
        // dumps (Spatie's default when no custom dump options are set).
        $env = [
            'PGPASSWORD' => (string) ($cfg['password'] ?? ''),
        ];

        $command = [
            'psql',
            '--host='.$cfg['host'],
            '--port='.$cfg['port'],
            '--username='.$cfg['username'],
            '--dbname='.$cfg['database'],
            '--quiet',
            '--file='.$dump,
        ];

        $process = new Process($command, null, $env, null, 3600);
        $process->run(function ($type, $buffer) {
            $this->getOutput()->write($buffer);
        });

        if (! $process->isSuccessful()) {
            $this->error('psql exited non-zero. Restore failed.');
            return;
        }

        $this->info('Database restore complete.');
    }

    private function cleanup(string $path): void
    {
        if (! is_dir($path)) {
            return;
        }
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($path, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST
        );
        foreach ($iterator as $f) {
            /** @var \SplFileInfo $f */
            $f->isDir() ? @rmdir($f->getPathname()) : @unlink($f->getPathname());
        }
        @rmdir($path);
    }
}
