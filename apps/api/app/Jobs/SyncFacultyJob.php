<?php

declare(strict_types=1);

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

class SyncFacultyJob implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 30;

    public int $timeout = 1800;

    public int $uniqueFor = 1800;

    public function __construct() {}

    public function handle(): void
    {
        Log::info('SyncFacultyJob: starting faculty sync');

        $exitCode = Artisan::call('sync:master-data', [
            '--type' => 'fakultas',
            '--source' => 'api',
            '--force' => true,
        ]);

        if ($exitCode !== 0) {
            Log::error('SyncFacultyJob: sync failed', ['exit' => $exitCode]);
            $this->fail(new \RuntimeException('sync:master-data exited with code '.$exitCode));

            return;
        }

        Log::info('SyncFacultyJob: sync completed', ['exit' => $exitCode]);
    }

    public function uniqueId(): string
    {
        return 'sync-faculty';
    }
}
