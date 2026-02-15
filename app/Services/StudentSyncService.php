<?php

namespace App\Services;

use App\Models\KKN\Fakultas;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Prodi;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

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
        $allExternalStudents = $this->masterApi->getAllStudents();
        
        if (!empty($nimList)) {
            $externalStudents = array_filter($allExternalStudents, function ($s) use ($nimList) {
                return in_array($s['nim'], $nimList);
            });
        } else {
            $externalStudents = $allExternalStudents;
        }

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
            if (isset($data['organization_id'])) {
                $facultyId = Fakultas::where('master_id', $data['organization_id'])->first()?->id;
            }
            
            $prodiId = null;
            if (isset($data['prodi_id'])) {
                $prodiId = Prodi::where('master_id', $data['prodi_id'])->first()?->id;
            }

            // Fallbacks
            if (!$facultyId) $facultyId = Fakultas::first()?->id;
            if (!$prodiId) $prodiId = Prodi::first()?->id;

            // 2. Create/Update User
            $user = User::firstOrCreate(
                ['username' => $data['nim']],
                [
                    'name' => $data['name'],
                    'email' => $data['email'] ?? $data['nim'] . '@student.uinsaizu.ac.id',
                    'password' => Hash::make('password123'),
                    'is_active' => true,
                ]
            );

            if (!$user->hasRole('student')) {
                $user->assignRole('student');
            }

            // 3. Create/Update Mahasiswa record
            Mahasiswa::updateOrCreate(
                ['nim' => $data['nim']],
                [
                    'user_id' => $user->id,
                    'nama' => $data['name'],
                    'faculty_id' => $facultyId,
                    'program_id' => $prodiId,
                    'batch_year' => $data['batch_year'] ?? date('Y'),
                    'gender' => $data['gender'] ?? 'L',
                    'master_id' => $data['id'] ?? null,
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
}