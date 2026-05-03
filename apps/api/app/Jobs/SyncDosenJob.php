<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Helpers\PasswordHelper;
use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Models\User;
use App\Services\MasterApiService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class SyncDosenJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 30;

    public function __construct(
        protected ?string $dosenId = null
    ) {}

    public function handle(MasterApiService $masterApi): void
    {
        Log::info('SyncDosenJob: starting dosen sync', ['id' => $this->dosenId]);

        try {
            if ($this->dosenId) {
                $this->syncSingleDosen($masterApi);
            } else {
                $this->syncAllDosen($masterApi);
            }
        } catch (\Exception $e) {
            Log::error('SyncDosenJob failed', [
                'id' => $this->dosenId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    protected function syncSingleDosen(MasterApiService $masterApi): void
    {
        $dosen = Dosen::where('nip', $this->dosenId)
            ->first();

        if (! $dosen) {
            $dosen = Dosen::find($this->dosenId);
        }

        if (! $dosen) {
            Log::warning('SyncDosenJob: dosen not found', ['id' => $this->dosenId]);

            return;
        }

        $nip = $dosen->nip;
        Log::info('SyncDosenJob: fetching single dosen from API', ['nip' => $nip]);

        $lecturers = $masterApi->getEmployeesByNipList([$nip]);

        if (empty($lecturers)) {
            Log::warning('SyncDosenJob: no data from API for NIP', ['nip' => $nip]);

            return;
        }

        foreach ($lecturers as $lecturerData) {
            $this->upsertLecturer($lecturerData);
            Log::info('SyncDosenJob: successfully synced dosen', ['nip' => $nip]);
        }
    }

    protected function syncAllDosen(MasterApiService $masterApi): void
    {
        Log::info('SyncDosenJob: syncing all dosen from API');

        $lecturers = $masterApi->getSyncDosen();
        $synced = 0;
        $errors = 0;

        foreach ($lecturers as $lecturerData) {
            try {
                $this->upsertLecturer($lecturerData);
                $synced++;
            } catch (\Exception $e) {
                $errors++;
                Log::error('SyncDosenJob: failed to sync lecturer', [
                    'nip' => $lecturerData['nip'] ?? 'unknown',
                    'error' => $e->getMessage(),
                ]);
            }
        }

        Log::info('SyncDosenJob: completed full sync', [
            'synced' => $synced,
            'errors' => $errors,
        ]);
    }

    protected function upsertLecturer(array $data): void
    {
        DB::transaction(function () use ($data) {
            $nip = $data['nip'] ?? null;
            if (! $nip) {
                throw new \InvalidArgumentException('NIP is required for lecturer sync');
            }

            $facultyId = null;
            $organizationMasterId = $this->normalizeMasterId($data['organization_id'] ?? null);
            if ($organizationMasterId !== null) {
                $facultyId = Fakultas::where('master_id', $organizationMasterId)->first()?->id;
            }

            $defaultFaculty = Fakultas::first();
            if (! $facultyId && $defaultFaculty) {
                $facultyId = $defaultFaculty->id;
            }

            $username = (string) $nip;
            $incomingEmail = $data['email'] ?? null;
            $fallbackEmail = $username.'@kkn.local';

            $user = User::firstOrNew(['username' => $username]);
            $isNewUser = ! $user->exists;

            if ($isNewUser) {
                $user->email = ! empty($incomingEmail) ? $incomingEmail : $fallbackEmail;
                $birthDate = $data['birth_date'] ?? null;
                $user->password = Hash::make(
                    PasswordHelper::fromBirthDate($birthDate, $username)
                );
                $user->must_change_password = true;
            } elseif (empty($user->email)) {
                $user->email = ! empty($incomingEmail) ? $incomingEmail : $fallbackEmail;
            }

            $user->username = $username;
            $user->name = $data['nama'] ?? $data['name'] ?? 'Unknown';
            $user->save();

            if (! $user->hasRole('dosen')) {
                $user->assignRole('dosen');
            }

            Dosen::updateOrCreate(
                ['nip' => $nip],
                [
                    'user_id' => $user->id,
                    'nama' => $data['nama'] ?? $data['name'] ?? 'Unknown',
                    'fakultas_id' => $facultyId,
                    'phone' => $data['phone'] ?? $data['telepon'] ?? null,
                    'gender' => $data['gender'] ?? $data['jenis_kelamin'] ?? 'L',
                    'birth_date' => $data['birth_date'] ?? $data['tanggal_lahir'] ?? null,
                    'is_cpns' => str_contains(strtoupper($data['status_pegawai'] ?? $data['employment_status'] ?? ''), 'CPNS'),
                    'is_tugas_belajar' => str_contains(strtoupper($data['status_aktif'] ?? $data['active_status'] ?? 'AKTIF'), 'TUGAS BELAJAR'),
                    'master_id' => $this->normalizeMasterId($data['id'] ?? $data['master_id'] ?? null),
                    'master_synced_at' => now(),
                ]
            );
        });
    }

    private function normalizeMasterId(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $normalized = trim((string) $value);

        return $normalized === '' ? null : $normalized;
    }
}
