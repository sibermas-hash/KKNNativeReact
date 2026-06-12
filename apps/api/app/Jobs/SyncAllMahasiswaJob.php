<?php

declare(strict_types=1);

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

class SyncAllMahasiswaJob implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 30;

    public int $timeout = 7200;

    public int $uniqueFor = 7200;

    /**
     * Create a new job instance.
     */
    public function __construct(
        private ?array $nimList = null
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info('SyncAllMahasiswaJob: starting mahasiswa sync', [
            'type' => $this->nimList ? 'targeted' : 'full',
            'count' => $this->nimList ? count($this->nimList) : 'all',
        ]);

        $params = [
            '--type' => 'mahasiswa',
            '--source' => 'api',
            '--force' => true,
        ];

        if ($this->nimList) {
            $params['--nim'] = $this->nimList;
        }

        $exitCode = Artisan::call('sync:master-data', $params);

        if ($exitCode !== 0) {
            Log::error('SyncAllMahasiswaJob: sync failed', ['exit' => $exitCode]);
            $this->fail(new \RuntimeException('sync:master-data exited with code '.$exitCode));

            return;
        }

        Log::info('SyncAllMahasiswaJob: sync completed', ['exit' => $exitCode]);
    }

    public function uniqueId(): string
    {
        return 'sync-all-mahasiswa:'.md5(json_encode($this->nimList ?? ['all']));
    }
}
