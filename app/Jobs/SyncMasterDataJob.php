<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

class SyncMasterDataJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(
        protected string $syncType = 'all',
        protected array $resources = [],
    ) {}

    public function handle(): void
    {
        Log::info('SyncMasterDataJob: starting sync', [
            'type' => $this->syncType,
            'resources' => $this->resources,
        ]);

        $exit = Artisan::call('sync:master-data', [
            '--type' => $this->syncType,
            '--source' => 'api',
            '--force' => true,
        ]);

        if ($exit !== 0) {
            Log::error('SyncMasterDataJob: sync failed', [
                'type' => $this->syncType,
                'exit' => $exit,
                'output' => Artisan::output(),
            ]);
            $this->fail(new \RuntimeException('sync:master-data exited with code ' . $exit));
            return;
        }

        Log::info('SyncMasterDataJob: sync completed', ['type' => $this->syncType]);
    }
}
