<?php

declare(strict_types=1);

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

class SyncFacultyJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct()
    {
    }

    public function handle(): void
    {
        Log::info('SyncFacultyJob: starting faculty sync');

        $exitCode = Artisan::call('sync:master-data', [
            '--type' => 'faculty',
            '--source' => 'api',
            '--force' => true,
        ]);

        if ($exitCode !== 0) {
            Log::error('SyncFacultyJob: sync failed', ['exit' => $exitCode]);
            $this->fail(new \RuntimeException('sync:master-data exited with code ' . $exitCode));
        }

        Log::info('SyncFacultyJob: sync completed', ['exit' => $exitCode]);
    }
}
