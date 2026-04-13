<?php

declare(strict_types=1);

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class SyncMahasiswaJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(
        protected ?string $mahasiswaId = null
    ) {
    }

    public function handle(): void
    {
        Log::info('SyncMahasiswaJob: starting mahasiswa sync', ['id' => $this->mahasiswaId]);

        // TODO: Implement incremental sync logic for specific mahasiswa
        // This would typically call MasterApiService->getSyncMahasiswa() and process the result
    }
}
