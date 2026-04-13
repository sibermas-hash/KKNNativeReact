<?php

declare(strict_types=1);

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class SyncDosenJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(
        protected ?string $dosenId = null
    ) {
    }

    public function handle(): void
    {
        Log::info('SyncDosenJob: starting dosen sync', ['id' => $this->dosenId]);

        // TODO: Implement incremental sync logic for specific dosen
        // This would typically call MasterApiService->getSyncDosen() and process the result
    }
}
