<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\KKN\Mahasiswa;
use App\Services\MasterApiService;
use App\Services\StudentSyncService;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SyncMahasiswaJob implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 30;

    // M-004 fix: was 3600 (1 hour). A stuck/failed job would hold the lock
    // for the full hour, blocking operator retries. 600s roughly matches the
    // longest reasonable sync run time; failed() below also releases eagerly.
    public int $uniqueFor = 600;

    public function uniqueId(): string
    {
        return $this->mahasiswaId ?? 'all';
    }

    public function __construct(
        protected ?string $mahasiswaId = null,
        protected ?string $since = null,
    ) {}

    public function handle(MasterApiService $masterApi, StudentSyncService $studentSync): void
    {
        Log::info('SyncMahasiswaJob: starting mahasiswa sync', ['id' => $this->mahasiswaId]);

        try {
            if ($this->mahasiswaId) {
                $this->syncSingleMahasiswa($masterApi, $studentSync);
            } else {
                $this->syncAllMahasiswa($studentSync);
            }
        } catch (\Exception $e) {
            Log::error('SyncMahasiswaJob failed', [
                'id' => $this->mahasiswaId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    protected function syncSingleMahasiswa(MasterApiService $masterApi, StudentSyncService $studentSync): void
    {
        $mahasiswa = Mahasiswa::whereBlind('nim', (string) $this->mahasiswaId)
            ->first();

        if (! $mahasiswa) {
            $mahasiswa = Mahasiswa::find($this->mahasiswaId);
        }

        if (! $mahasiswa) {
            Log::warning('SyncMahasiswaJob: mahasiswa not found', ['id' => $this->mahasiswaId]);

            return;
        }

        $nim = $mahasiswa->nim;
        Log::info('SyncMahasiswaJob: fetching single mahasiswa from API', ['nim' => $nim]);

        $students = $masterApi->getStudentsByNimList([$nim]);

        if (empty($students)) {
            Log::warning('SyncMahasiswaJob: no data from API for NIM', ['nim' => $nim]);

            return;
        }

        foreach ($students as $studentData) {
            $studentSync->upsertStudent($studentData);
            Log::info('SyncMahasiswaJob: successfully synced mahasiswa', ['nim' => $nim]);
        }
    }

    protected function syncAllMahasiswa(StudentSyncService $studentSync): void
    {
        Log::info('SyncMahasiswaJob: syncing mahasiswa from API', ['since' => $this->since]);

        // Pass since parameter for delta sync (only fetch records changed after this timestamp)
        $results = $studentSync->syncFromApi([], $this->since);

        Log::info('SyncMahasiswaJob: completed sync', [
            'total' => $results['total'],
            'synced' => $results['synced'],
            'errors' => $results['errors'],
            'mode' => $this->since ? 'delta' : 'full',
        ]);
    }

    /**
     * M-004 fix: release the ShouldBeUnique lock eagerly on failure so the
     * operator's retry isn't blocked by the remainder of the uniqueFor window.
     */
    public function failed(\Throwable $e): void
    {
        Cache::forget('laravel_unique_job:'.$this->uniqueId());

        Log::warning('SyncMahasiswaJob failed — released unique lock', [
            'id' => $this->mahasiswaId,
            'error' => $e->getMessage(),
        ]);
    }
}
