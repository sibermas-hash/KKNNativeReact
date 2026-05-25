<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Helpers\PasswordHelper;
use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Models\User;
use App\Services\MasterApiService;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;

class SyncDosenJob implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 30;

    public int $timeout = 7200;

    public int $uniqueFor = 7200;

    public function uniqueId(): string
    {
        return 'sync-dosen:'.($this->dosenId ?? 'all');
    }

    public function __construct(
        protected ?string $dosenId = null,
        protected ?string $since = null,
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
        $dosen = Dosen::whereBlind('nip', (string) $this->dosenId)
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
        Log::info('SyncDosenJob: syncing dosen from API', ['since' => $this->since]);

        // Use yieldSyncDosen for memory-efficient streaming with optional delta sync
        $lecturers = $masterApi->yieldSyncDosen($this->since);
        $synced = 0;
        $errors = 0;

        $skippedNoNip = 0;
        foreach ($lecturers as $lecturerData) {
            // Master API: hanya proses dosen yg punya NIP berupa angka murni (PNS/NIDN).
            // Skip kode honorer (LB-xxx, DOS-xxx) sesuai kebijakan SIBERMAS.
            $nip = trim((string) ($lecturerData['nip'] ?? ''));
            if ($nip === '' || ! preg_match('/^\d+$/', $nip)) {
                $skippedNoNip++;
                continue;
            }
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

        Log::info('SyncDosenJob: completed sync', [
            'synced' => $synced,
            'errors' => $errors,
            'skipped_no_nip' => $skippedNoNip,
            'mode' => $this->since ? 'delta' : 'full',
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
            $incomingEmail = $this->normalizeMasterEmail($data['email'] ?? null);

            $user = User::firstOrNew(['username' => $username]);
            $isNewUser = ! $user->exists;

            if ($isNewUser) {
                $user->email = ! empty($incomingEmail) ? $incomingEmail : null;
                // C-002 fix: random unguessable password; reset link below.
                $user->password = Hash::make(PasswordHelper::generateSecureDefault());
                $user->must_change_password = true;
            } elseif (empty($user->email) && ! empty($incomingEmail)) {
                $user->email = $incomingEmail;
            }

            $user->username = $username;
            // Respect field locks — admin may have corrected name from SIAKAD
            $candidateName = $data['nama'] ?? $data['name'] ?? 'Unknown';
            if ($isNewUser || ! $user->isFieldLocked('name')) {
                $user->name = $candidateName;
            }
            $user->save();

            if (! $user->hasRole('dosen')) {
                $user->assignRole('dosen');
            }

            // Load existing dosen for field-lock check
            $existingDosen = Dosen::whereBlind('nip', (string) $nip)->first();

            $dosenPayload = [
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
            ];

            // Respect per-dosen field locks on existing records
            if ($existingDosen) {
                $dosenPayload = $existingDosen->filterLockedFields($dosenPayload);
            }

            Dosen::updateOrCreate(
                ['nip' => $nip],
                $dosenPayload
            );

            // C-002 follow-up: reset-link dispatch after commit.
            if ($isNewUser && ! empty($user->email)) {
                $userEmail = $user->email;
                DB::afterCommit(function () use ($userEmail, $nip) {
                    try {
                        Password::sendResetLink(['email' => $userEmail]);
                    } catch (\Throwable $e) {
                        Log::warning('SyncDosenJob reset-link dispatch failed', [
                            'nip' => $nip, 'error' => $e->getMessage(),
                        ]);
                    }
                });
            }
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

    private function normalizeMasterEmail(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $email = trim((string) $value);
        if ($email === '' || str_ends_with(strtolower($email), '@kkn.local')) {
            return null;
        }

        return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : null;
    }
}
