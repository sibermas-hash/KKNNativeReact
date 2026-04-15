<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\KKN\Mahasiswa;
use App\Services\MasterApiService;
use App\Services\StudentSyncService;
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
        $mahasiswa = Mahasiswa::on('kkn')
            ->where('nim', $this->mahasiswaId)
            ->first();

        if (! $mahasiswa) {
            $mahasiswa = Mahasiswa::on('kkn')->find($this->mahasiswaId);
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
        Log::info('SyncMahasiswaJob: syncing all mahasiswa from API');

        $results = $studentSync->syncFromApi();

        Log::info('SyncMahasiswaJob: completed full sync', [
            'total' => $results['total'],
            'synced' => $results['synced'],
            'errors' => $results['errors'],
        ]);
    }
}
