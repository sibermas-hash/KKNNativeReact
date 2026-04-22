<?php

declare(strict_types=1);

namespace App\Services;

use App\Helpers\PasswordHelper;
use App\Models\KKN\Fakultas;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Prodi;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

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
     */
    public function syncFromApi(array $nimList = []): array
    {
        $this->loadMaps();

        $results = [
            'total' => 0,
            'synced' => 0,
            'errors' => 0,
            'log' => [],
        ];

        $externalStudents = ! empty($nimList)
            ? $this->masterApi->getStudentsByNimList($nimList)
            : $this->masterApi->yieldSyncMahasiswa();

        foreach ($externalStudents as $studentData) {
            $results['total']++;
            try {
                $status = $this->upsertStudent($studentData);
                if ($status) {
                    $results['synced']++;
                } else {
                    $results['errors']++;
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
     */
    public function upsertStudent(array $data, bool $useCachedMaps = true): bool
    {
        return DB::transaction(function () use ($data, $useCachedMaps) {
            if ($useCachedMaps && $this->mapsLoaded) {
                $organizationMasterId = $this->normalizeMasterId($data['organization_id'] ?? null);
                $facultyId = $organizationMasterId !== null ? ($this->facultyMap[$organizationMasterId] ?? null) : null;

                $programMasterId = $this->normalizeMasterId($data['prodi_id'] ?? null);
                $prodiId = $programMasterId !== null ? ($this->prodiMap[$programMasterId] ?? null) : null;
            } else {
                $facultyId = null;
                $organizationMasterId = $this->normalizeMasterId($data['organization_id'] ?? null);
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

            $password = PasswordHelper::fromBirthDate(
                $data['birth_date'] ?? null,
                $data['nim']
            );

            $email = $data['email'] ?? $data['nim'].'@student.uinsaizu.ac.id';
            $isNewUser = ! User::where('username', $data['nim'])->exists();

            $user = User::firstOrCreate(
                ['username' => $data['nim']],
                [
                    'name' => $data['name'],
                    'email' => $email,
                    'password' => Hash::make($password),
                    'is_active' => true,
                    'must_change_password' => true,
                ]
            );

            $address = $data['address'] ?? $data['alamat'] ?? $data['domicile'] ?? null;

            $user->fill(array_filter([
                'name' => $data['name'] ?? null,
                'email' => $email,
                'address' => $address,
            ], static fn ($value) => $value !== null && $value !== ''));

            if ($user->isDirty()) {
                $user->save();
            }

            if (! $user->hasRole('student')) {
                $user->assignRole('student');
            }

            Mahasiswa::updateOrCreate(
                ['nim' => $data['nim']],
                [
                    'user_id' => $user->id,
                    'nama' => $data['name'],
                    'nik' => $data['nik'] ?? $data['national_id'] ?? null,
                    'mother_name' => $data['mother_name'] ?? $data['nama_ibu'] ?? $data['mother'] ?? null,
                    'fakultas_id' => $facultyId,
                    'prodi_id' => $prodiId,
                    'batch_year' => $data['batch_year'] ?? date('Y'),
                    'gender' => $data['gender'] ?? 'L',
                    'birth_date' => $data['birth_date'] ?? null,
                    'sks_completed' => $data['sks_completed'] ?? $data['sks'] ?? 0,
                    'gpa' => $data['gpa'] ?? $data['ipk'] ?? 0.0,
                    'status_bta_ppi' => $data['status_bta_ppi'] ?? ($data['bta_ppi_passed'] ?? false ? 'LULUS' : 'BELUM_LULUS'),
                    'is_paid_ukt' => $data['is_paid_ukt'] ?? $data['ukt_paid'] ?? false,
                    'master_id' => $this->normalizeMasterId($data['id'] ?? null),
                    'master_synced_at' => now(),
                ]
            );

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
}
