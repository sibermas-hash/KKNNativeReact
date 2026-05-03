<?php

declare(strict_types=1);

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

class SyncProgramJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 30;

    public function __construct() {}

    public function handle(): void
    {
        Log::info('SyncProgramJob: starting program sync');

        $exitCode = Artisan::call('sync:master-data', [
            '--type' => 'program',
            '--source' => 'api',
            '--force' => true,
        ]);

        if ($exitCode !== 0) {
            Log::error('SyncProgramJob: sync failed', ['exit' => $exitCode]);
            $this->fail(new \RuntimeException('sync:master-data exited with code '.$exitCode));
        }

        Log::info('SyncProgramJob: sync completed', ['exit' => $exitCode]);
    }
}
