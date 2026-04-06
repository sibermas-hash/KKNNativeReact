<?php

namespace App\Services;

use App\Helpers\PasswordHelper;
use App\Models\KKN\Fakultas;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Prodi;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class StudentSyncService
{
    public function __construct(
        private MasterApiService $masterApi
    ) {}

    /**
     * Sync students from Master API.
     */
    public function syncFromApi(array $nimList = []): array
    {
        $externalStudents = !empty($nimList)
            ? $this->masterApi->getStudentsByNimList($nimList)
            : $this->masterApi->getAllStudents();

        $results = [
            'total' => count($externalStudents),
            'synced' => 0,
            'errors' => 0,
            'log' => []
        ];

        foreach ($externalStudents as $studentData) {
            try {
                $status = $this->upsertStudent($studentData);
                if ($status) {
                    $results['synced']++;
                } else {
                    $results['errors']++;
                }
            } catch (\Exception $e) {
                $results['errors']++;
                $results['log'][] = "Error syncing NIM {$studentData['nim']}: " . $e->getMessage();
            }
        }

        return $results;
    }

    /**
     * Create or update student and their associated user account.
     */
    public function upsertStudent(array $data): bool
    {
        return DB::transaction(function () use ($data) {
            // 1. Resolve Faculty & Prodi
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

            // Fallbacks - Log warning instead of silent wrong assignment
            if (!$facultyId && $organizationMasterId !== null) {
                Log::warning("Student {$data['nim']} has unmapped organization_id: {$organizationMasterId}. Skipping faculty assignment.");
            }
            if (!$prodiId && $programMasterId !== null) {
                Log::warning("Student {$data['nim']} has unmapped prodi_id: {$programMasterId}. Skipping prodi assignment.");
            }

            // 2. Determine Password (DDMMYYYY from birth_date or fallback to NIM)
            $password = PasswordHelper::fromBirthDate(
                $data['birth_date'] ?? null,
                $data['nim']
            );

            // 3. Create/Update User
            $user = User::firstOrCreate(
                ['username' => $data['nim']],
                [
                    'name' => $data['name'],
                    'email' => $data['email'] ?? $data['nim'] . '@student.uinsaizu.ac.id',
                    'password' => Hash::make($password),
                    'is_active' => true,
                ]
            );

            $address = $data['address'] ?? $data['alamat'] ?? null;
            $email = $data['email'] ?? $data['nim'] . '@student.uinsaizu.ac.id';

            $user->fill(array_filter([
                'name' => $data['name'] ?? null,
                'email' => $email,
                'address' => $address,
            ], static fn ($value) => $value !== null && $value !== ''));

            if ($user->isDirty()) {
                $user->save();
            }

            if (!$user->hasRole('student')) {
                $user->assignRole('student');
            }

            // 3. Create/Update Mahasiswa record
            Mahasiswa::updateOrCreate(
                ['nim' => $data['nim']],
                [
                    'user_id' => $user->id,
                    'nama' => $data['name'],
                    'nik' => $data['nik'] ?? $data['national_id'] ?? null,
                    'mother_name' => $data['mother_name'] ?? $data['nama_ibu'] ?? $data['mother'] ?? null,
                    'faculty_id' => $facultyId,
                    'program_id' => $prodiId,
                    'batch_year' => $data['batch_year'] ?? date('Y'),
                    'gender' => $data['gender'] ?? 'L',
                    'birth_date' => $data['birth_date'] ?? null,
                    'sks_completed' => $data['sks_completed'] ?? $data['sks'] ?? 0,
                    'gpa' => $data['gpa'] ?? $data['ipk'] ?? 0.0,
                    'is_bta_ppi_passed' => $data['is_bta_ppi_passed'] ?? $data['bta_ppi_passed'] ?? false,
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
            'errors' => $errors
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
