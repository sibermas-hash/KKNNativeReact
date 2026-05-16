<?php

declare(strict_types=1);

namespace App\Services;

use App\Helpers\PasswordHelper;
use App\Models\KKN\Fakultas;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Prodi;
use App\Models\User;
use App\Services\MasterApi\MasterDataSanitizer;
use App\Services\MasterApi\SiakadRecordFilter;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;

class StudentSyncService
{
    protected array $facultyMap = [];

    protected array $prodiMap = [];

    protected bool $mapsLoaded = false;

    public function __construct(
        private MasterApiService $masterApi
    ) {}

    protected function loadMaps(): void
    {
        if ($this->mapsLoaded) {
            return;
        }

        $this->facultyMap = Fakultas::pluck('id', 'master_id')->all();
        $this->prodiMap = Prodi::pluck('id', 'master_id')->all();
        $this->mapsLoaded = true;
    }

    /**
     * Sync students from Master API.
     *
     * @param  array  $nimList  Specific NIMs to sync (empty = all)
     * @param  string|null  $since  ISO 8601 timestamp for delta sync (e.g. '2026-05-01T00:00:00Z')
     */
    public function syncFromApi(array $nimList = [], ?string $since = null): array
    {
        $this->loadMaps();

        $results = [
            'total' => 0,
            'synced' => 0,
            'errors' => 0,
            'filtered' => 0,
            'log' => [],
        ];

        $externalStudents = ! empty($nimList)
            ? $this->masterApi->getStudentsByNimList($nimList)
            : $this->masterApi->yieldSyncMahasiswa($since);

        foreach ($externalStudents as $studentData) {
            $results['total']++;
            try {
                $status = $this->upsertStudent($studentData);
                if ($status) {
                    $results['synced']++;
                } else {
                    // upsertStudent returns false when the record was filtered
                    // out before any DB write (see SiakadRecordFilter).
                    $results['filtered']++;
                }
            } catch (\Exception $e) {
                $results['errors']++;
                $results['log'][] = 'Error syncing NIM '.($studentData['nim'] ?? 'UNKNOWN').': '.$e->getMessage();
                Log::error('Student Sync Error', [
                    'nim' => $studentData['nim'] ?? 'UNKNOWN',
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $results;
    }

    /**
     * Create or update student and their associated user account.
     *
     * Returns false when the record was filtered out BEFORE any DB write
     * (see config/siakad_filters.php). Callers should treat false as
     * "skipped, not an error".
     */
    public function upsertStudent(array $data, bool $useCachedMaps = true, bool $dispatchWelcomeEmail = true): bool
    {
        // Pre-DB filter — config/siakad_filters.php rules decide whether
        // this SIAKAD record should even enter the database.
        $decision = app(SiakadRecordFilter::class)->shouldSyncStudent($data);
        if ($decision['action'] !== SiakadRecordFilter::SYNC) {
            Log::info('SIAKAD student filtered out before DB write', [
                'reason' => $decision['reason'],
                'label' => SiakadRecordFilter::reasonLabel($decision['reason'] ?? ''),
                'detail' => $decision['details'],
            ]);

            return false;
        }

        // "Sudah KKN" guard: if the mahasiswa has ever been placed into a
        // KKN group, freeze their record — no SIAKAD update, no user update.
        // Per business rule: their SIBERMAS data is the snapshot at the time
        // they joined KKN, and must not mutate.
        $existingMhs = Mahasiswa::whereBlind('nim', (string) $data['nim'])->first();
        if ($existingMhs && $existingMhs->hasEverBeenInKkn()) {
            Log::info('SIAKAD sync skipped — mahasiswa already in KKN', ['nim' => $data['nim']]);

            return false;
        }

        return DB::transaction(function () use ($data, $useCachedMaps, $existingMhs) {
            if ($useCachedMaps && $this->mapsLoaded) {
                $organizationMasterId = $this->normalizeMasterId($data['organization_id'] ?? $data['fakultas_id'] ?? null);
                $facultyId = $organizationMasterId !== null ? ($this->facultyMap[$organizationMasterId] ?? null) : null;

                $programMasterId = $this->normalizeMasterId($data['prodi_id'] ?? null);
                $prodiId = $programMasterId !== null ? ($this->prodiMap[$programMasterId] ?? null) : null;
            } else {
                $facultyId = null;
                $organizationMasterId = $this->normalizeMasterId($data['organization_id'] ?? $data['fakultas_id'] ?? null);
                if ($organizationMasterId !== null) {
                    $facultyId = Fakultas::where('master_id', $organizationMasterId)->first()?->id;
                }

                $prodiId = null;
                $programMasterId = $this->normalizeMasterId($data['prodi_id'] ?? null);
                if ($programMasterId !== null) {
                    $prodiId = Prodi::where('master_id', $programMasterId)->first()?->id;
                }
            }

            if (! $facultyId && $organizationMasterId !== null) {
                Log::warning("Student {$data['nim']} has unmapped organization_id: {$organizationMasterId}. Skipping faculty assignment.");
            }
            if (! $prodiId && $programMasterId !== null) {
                Log::warning("Student {$data['nim']} has unmapped prodi_id: {$programMasterId}. Skipping prodi assignment.");
            }

            $password = PasswordHelper::fromBirthDate($data['tanggal_lahir'] ?? $data['birth_date'] ?? null)
                ?? PasswordHelper::generateSecureDefault();

            $email = $this->normalizeMasterEmail($data['email'] ?? null);
            $isNewUser = ! User::where('username', $data['nim'])->exists();

            $nama = $data['nama'] ?? $data['name'] ?? 'Unknown';

            $user = User::firstOrCreate(
                ['username' => $data['nim']],
                [
                    'name' => $nama,
                    'email' => $email,
                    'password' => Hash::make($password),
                    'is_active' => true,
                    'must_change_password' => true,
                ]
            );

            $address = $data['address'] ?? $data['alamat'] ?? null;

            // Respect per-user field locks (fields that admin/mahasiswa has
            // edited manually must not be overwritten by SIAKAD sync).
            $userUpdates = array_filter([
                'name' => $nama,
                'email' => $email,
                'address' => $address,
            ], static fn ($value) => $value !== null && $value !== '');

            $user->fill($user->filterLockedFields($userUpdates));

            if ($user->isDirty()) {
                $user->save();
            }

            if (! $isNewUser && $password && ($user->must_change_password || is_null($user->password_changed_at))) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'must_change_password' => true,
                ])->save();
            }

            if (! $user->hasRole('student')) {
                $user->assignRole('student');
            }

            $sksValue = (int) ($data['sks_completed'] ?? $data['sks'] ?? $data['total_sks'] ?? $data['sks_lulus'] ?? 0);

            // Data-quality audit: SIAKAD sometimes returns corrupt GPA
            // (seen: 11.05, 9.00, etc.) and malformed NIK (empty string,
            // 15/17/18-char). Sanitize here so eligibility/reporting code
            // downstream can trust the values.
            $gpa = MasterDataSanitizer::gpa($data['gpa'] ?? $data['ipk'] ?? null, $data['nim']);
            $nik = MasterDataSanitizer::nik($data['nik'] ?? $data['national_id'] ?? null, $data['nim']);

            $mahasiswaUpdates = [
                'user_id' => $user->id,
                'nama' => $nama,
                'nik' => $nik,
                'mother_name' => $data['mother_name'] ?? $data['nama_ibu'] ?? $data['mother'] ?? null,
                'fakultas_id' => $facultyId,
                'prodi_id' => $prodiId,
                'batch_year' => $data['batch_year'] ?? $data['angkatan'] ?? date('Y'),
                'gender' => $data['gender'] ?? $data['jenis_kelamin'] ?? 'L',
                'birth_date' => $data['birth_date'] ?? $data['tanggal_lahir'] ?? null,
                'sks_completed' => $sksValue,
                'gpa' => $gpa,
                'status_bta_ppi' => $data['status_bta_ppi'] ?? ($data['bta_ppi_passed'] ?? false ? 'LULUS' : 'BELUM_LULUS'),
                'is_paid_ukt' => $data['is_paid_ukt'] ?? $data['ukt_paid'] ?? false,
                'master_id' => $this->normalizeMasterId($data['id'] ?? $data['master_id'] ?? null),
                'master_synced_at' => now(),
            ];

            // Respect per-mahasiswa field locks on EXISTING records. Fields
            // the admin has edited stay as they are. Newly-created rows have
            // no locks yet, so nothing is filtered.
            if ($existingMhs) {
                $mahasiswaUpdates = $existingMhs->filterLockedFields($mahasiswaUpdates);
            }

            Mahasiswa::updateOrCreate(
                ['nim' => $data['nim']],
                $mahasiswaUpdates
            );

            // Student accounts use DDMMYYYY from SIAKAD birth date as the
            // first-login password, then must rotate it immediately.
            // R-001 fix (audit): dispatch AFTER commit to avoid emailing
            // rolled-back users or queueing notifications from inside the tx.
            // SYNC_SEND_WELCOME_EMAIL=false disables this during bulk sync
            // to prevent Gmail SMTP rate-limit (454 Too many login attempts).
            if ($isNewUser && $dispatchWelcomeEmail && config('services.sync.send_welcome_email', true)) {
                if (! empty($user->email)) {
                    $userEmail = $user->email;
                    $nim = $data['nim'];
                    DB::afterCommit(function () use ($userEmail, $nim) {
                        try {
                            Password::sendResetLink(['email' => $userEmail]);
                            Log::info('Mahasiswa password-reset link dispatched', ['nim' => $nim, 'email' => $userEmail]);
                        } catch (\Throwable $e) {
                            Log::warning('Failed to send initial reset link for new mahasiswa', [
                                'nim' => $nim, 'error' => $e->getMessage(),
                            ]);
                        }
                    });
                } else {
                    Log::warning('New mahasiswa has no email; manual password provisioning required', [
                        'nim' => $data['nim'],
                    ]);
                }
            } elseif ($isNewUser && (! $dispatchWelcomeEmail || ! config('services.sync.send_welcome_email', true))) {
                Log::info('Mahasiswa created without welcome email (SYNC_SEND_WELCOME_EMAIL=false)', [
                    'nim' => $data['nim'],
                ]);
            }

            return true;
        });
    }

    /**
     * Specialized validation for Excel imports to prevent crashes.
     */
    public function validateAndPrepareImportData(array $rows): array
    {
        $validRows = [];
        $errors = [];

        foreach ($rows as $index => $row) {
            $line = $index + 2; // offset for header

            // Basic validation
            if (empty($row['nim']) || empty($row['nama'])) {
                $errors[] = "Baris {$line}: NIM dan Nama wajib diisi.";

                continue;
            }

            // Check for existing NIM
            // Note: In a real hybrid sync, we might want to update instead of skip
            $validRows[] = $row;
        }

        return [
            'data' => $validRows,
            'errors' => $errors,
        ];
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
