<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\DispensasiKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\SystemSetting;

class EligibilityService
{
    /**
     * Check if a student is eligible to register for KKN
     */
    public function checkEligibility(Mahasiswa $mahasiswa, ?int $periodeId = null, array $preloadedData = []): array
    {
        $periode = $preloadedData['periode'] ?? Periode::find($periodeId) ?? Periode::getActivePeriod();

        $checks = [
            'registration_window' => $this->checkRegistrationWindow($periode),
            'no_prior_completion' => $this->checkNoPriorCompletion($mahasiswa, $preloadedData['completed_ids'] ?? null),
            'min_sks' => $this->checkMinimumSKS($mahasiswa, $periode, $preloadedData['settings'] ?? []),
            'min_gpa' => $this->checkMinimumGPA($mahasiswa, $periode, $preloadedData['settings'] ?? []),
            'bta_ppi' => $this->checkBtaPpi($mahasiswa),
            'program_prodi' => $this->checkProgramProdiRestriction($mahasiswa, $periode),
            'personal_status' => $this->checkPersonalStatusMandate($mahasiswa, $periode),
            'documents' => $this->checkDocuments($mahasiswa),
            'no_active_registration' => $this->checkNoActiveRegistration($mahasiswa, $periodeId, $preloadedData['active_reg_ids'] ?? null),
        ];

        // Apply dispensasi bypass — override failed checks if student has active dispensasi
        $bypassed = $preloadedData['dispensations'][$mahasiswa->nim]
            ?? DispensasiKkn::getBypassedRequirements($mahasiswa->nim, $periodeId);

        $hasDispensasi = ! empty($bypassed);

        if ($hasDispensasi) {
            foreach ($bypassed as $key) {
                if (isset($checks[$key]) && ! $checks[$key]['passed']) {
                    $checks[$key]['passed'] = true;
                    $checks[$key]['message'] = ($checks[$key]['message'] ?? '').' (DISPENSASI)';
                    $checks[$key]['dispensasi'] = true;
                }
            }
        }

        $issues = array_filter($checks, fn ($check) => ! $check['passed']);

        return [
            'mahasiswa_id' => $mahasiswa->id,
            'nim' => $mahasiswa->nim,
            'nama' => $mahasiswa->nama,
            'sks_completed' => $mahasiswa->sks_completed,
            'gpa' => $mahasiswa->gpa,
            'is_bta_ppi_passed' => $mahasiswa->is_bta_ppi_passed,
            'has_health_certificate' => ! empty($mahasiswa->health_certificate_path),
            'has_parent_permission' => ! empty($mahasiswa->parent_permission_path),
            'checks' => $checks,
            'is_eligible' => empty($issues),
            'issues' => array_values($issues),
            'issue_count' => count($issues),
            'has_dispensasi' => $hasDispensasi,
        ];
    }

    /**
     * Check registration window
     */
    private function checkRegistrationWindow(?Periode $periode): array
    {
        if (! $periode) {
            return ['passed' => false, 'key' => 'no_active_period', 'message' => 'Tidak ada periode KKN aktif'];
        }

        $now = now();
        $withinWindow = $now->between($periode->registration_start, $periode->registration_end);

        return [
            'passed' => $withinWindow,
            'key' => 'registration_window',
            'message' => $withinWindow
                ? 'Dalam jadwal registrasi'
                : 'Di luar jadwal registrasi',
            'registration_start' => $periode->registration_start?->format('d M Y'),
            'registration_end' => $periode->registration_end?->format('d M Y'),
        ];
    }

    /**
     * Check no prior KKN completion
     */
    private function checkNoPriorCompletion(Mahasiswa $mahasiswa, ?array $preloadedIds = null): array
    {
        $hasCompleted = $preloadedIds
            ? isset($preloadedIds[$mahasiswa->id])
            : PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
                ->where('status', 'completed')
                ->exists();

        return [
            'passed' => ! $hasCompleted,
            'key' => 'no_prior_completion',
            'message' => $hasCompleted
                ? 'Sudah lulus KKN sebelumnya'
                : 'Belum pernah lulus KKN',
        ];
    }

    /**
     * Check minimum SKS requirement
     */
    private function checkMinimumSKS(Mahasiswa $mahasiswa, ?Periode $periode = null): array
    {
        // Prioritaskan dari Master Data Jenis KKN (jika ada)
        $minSks = $periode?->jenisKkn?->min_sks
                ?? SystemSetting::get('min_sks_registration', 100);

        $hasEnoughSks = ($mahasiswa->sks_completed ?? 0) >= $minSks;

        return [
            'passed' => $hasEnoughSks,
            'key' => 'min_sks',
            'message' => $hasEnoughSks
                ? "SKS mencukupi ({$mahasiswa->sks_completed}/{$minSks})"
                : "SKS tidak mencukupi ({$mahasiswa->sks_completed}/{$minSks})",
            'current_sks' => $mahasiswa->sks_completed,
            'required_sks' => $minSks,
        ];
    }

    /**
     * Check minimum GPA requirement (optional)
     */
    private function checkMinimumGPA(Mahasiswa $mahasiswa, ?Periode $periode = null): array
    {
        // Prioritaskan dari Master Data Jenis KKN (jika ada)
        $minGpa = $periode?->jenisKkn ? (float) $periode->jenisKkn->min_gpa : null;
        $isDynamic = $minGpa !== null && $minGpa > 0;

        if (! $isDynamic) {
            $minGpaEnabled = SystemSetting::get('enable_gpa_requirement', false);

            if (! $minGpaEnabled) {
                return [
                    'passed' => true,
                    'key' => 'min_gpa',
                    'message' => 'Validasi IPK tidak diaktifkan',
                    'enabled' => false,
                ];
            }

            $minGpa = SystemSetting::get('min_gpa_registration', 2.00);
        }

        $studentGpa = $mahasiswa->gpa ?? 0;
        $hasEnoughGpa = $studentGpa >= $minGpa;

        return [
            'passed' => $hasEnoughGpa,
            'key' => 'min_gpa',
            'message' => $hasEnoughGpa
                ? "IPK mencukupi ({$studentGpa}/{$minGpa})"
                : "IPK tidak mencukupi ({$studentGpa}/{$minGpa})",
            'current_gpa' => $studentGpa,
            'required_gpa' => $minGpa,
            'enabled' => true,
        ];
    }

    /**
     * Check BTA-PPI certification
     */
    private function checkBtaPpi(Mahasiswa $mahasiswa): array
    {
        $passed = $mahasiswa->is_bta_ppi_passed ?? false;

        return [
            'passed' => $passed,
            'key' => 'bta_ppi',
            'message' => $passed ? 'Lulus BTA-PPI' : 'Belum lulus BTA-PPI',
        ];
    }

    /**
     * Restriction check for specific programs like Kampung Zakat (Mazawa only)
     */
    private function checkProgramProdiRestriction(Mahasiswa $mahasiswa, ?Periode $periode): array
    {
        if (! $periode || ! $periode->jenisKkn) {
            return ['passed' => true, 'key' => 'program_prodi', 'message' => 'N/A'];
        }

        $kknTypeLabel = strtolower($periode->jenisKkn->name);

        if (str_contains($kknTypeLabel, 'zakat')) {
            $mahasiswa->loadMissing('prodi');
            $prodiName = strtolower($mahasiswa->prodi?->nama ?? '');
            $isMazawa = str_contains($prodiName, 'zakat') || str_contains($prodiName, 'mazawa');

            return [
                'passed' => $isMazawa,
                'key' => 'program_prodi',
                'message' => $isMazawa ? 'Prodi sesuai (Mazawa)' : 'Skema ini khusus untuk mahasiswa Prodi Mazawa',
                'reason' => 'Khusus Program Studi Manajemen Zakat dan Wakaf (Mazawa).',
            ];
        }

        return ['passed' => true, 'key' => 'program_prodi', 'message' => 'Lolos sensor fakultas/prodi'];
    }

    /**
     * Mandatory status notices for special KKN (Panduan KKN 56)
     */
    private function checkPersonalStatusMandate(Mahasiswa $mahasiswa, ?Periode $periode): array
    {
        if (! $periode || ! $periode->jenisKkn) {
            return ['passed' => true, 'key' => 'personal_status', 'message' => 'N/A'];
        }

        $specialPrograms = ['nusantara', 'internasional', 'kolaborasi', 'tematik', 'katana', 'zakat'];
        $kknTypeLabel = strtolower($periode->jenisKkn->name);

        $isSpecial = false;
        foreach ($specialPrograms as $program) {
            if (str_contains($kknTypeLabel, $program)) {
                $isSpecial = true;
                break;
            }
        }

        if ($isSpecial) {
            return [
                'passed' => true, // Notice only, manual verification by Admin later
                'key' => 'personal_status',
                'message' => 'WAJIB: Belum Menikah & Tidak Sedang Hamil/Menyusui (Khusus Perempuan)',
            ];
        }

        return ['passed' => true, 'key' => 'personal_status', 'message' => 'Lolos kriteria umum'];
    }

    /**
     * Check required documents
     */
    private function checkDocuments(Mahasiswa $mahasiswa): array
    {
        $hasHealthCert = ! empty($mahasiswa->health_certificate_path);
        $hasParentPerm = ! empty($mahasiswa->parent_permission_path);
        $allDocs = $hasHealthCert && $hasParentPerm;

        return [
            'passed' => $allDocs,
            'key' => 'documents',
            'message' => $allDocs
                ? 'Dokumen lengkap'
                : 'Dokumen tidak lengkap',
            'has_health_certificate' => $hasHealthCert,
            'has_parent_permission' => $hasParentPerm,
        ];
    }

    /**
     * Check no active registration in other periods
     */
    private function checkNoActiveRegistration(Mahasiswa $mahasiswa, ?int $currentPeriodeId = null, ?array $preloadedIds = null): array
    {
        $hasActive = $preloadedIds
            ? isset($preloadedIds[$mahasiswa->id])
            : PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
                ->whereIn('status', ['pending', 'approved'])
                ->when($currentPeriodeId, fn ($q) => $q->where('period_id', '!=', $currentPeriodeId))
                ->exists();

        return [
            'passed' => ! $hasActive,
            'key' => 'no_active_registration',
            'message' => $hasActive
                ? 'Masih memiliki pendaftaran aktif di periode lain'
                : 'Tidak ada pendaftaran aktif',
        ];
    }

    /**
     * Get all eligible students for a period
     */
    public function getEligibleStudents(?int $periodeId = null, ?int $facultyId = null)
    {
        $periode = $periodeId ? Periode::with('jenisKkn')->find($periodeId) : Periode::getActivePeriod();

        $query = Mahasiswa::with(['user', 'prodi.fakultas', 'fakultas']);

        if ($facultyId) {
            $query->where('faculty_id', $facultyId);
        }

        $students = $query->get();
        $studentIds = $students->pluck('id')->toArray();
        $studentNims = $students->pluck('nim')->toArray();

        // BATCH PRE-LOADING: Avoid N+1 queries in loop
        $completedIds = PesertaKkn::whereIn('mahasiswa_id', $studentIds)
            ->where('status', 'completed')
            ->pluck('mahasiswa_id')
            ->toArray();

        $activeRegIds = PesertaKkn::whereIn('mahasiswa_id', $studentIds)
            ->whereIn('status', ['pending', 'approved'])
            ->when($periodeId, fn ($q) => $q->where('period_id', '!=', $periodeId))
            ->pluck('mahasiswa_id')
            ->toArray();

        $dispensations = DispensasiKkn::whereIn('nim', $studentNims)
            ->where(function ($q) use ($periodeId) {
                $q->whereNull('period_id')->orWhere('period_id', $periodeId);
            })
            ->get()
            ->groupBy('nim')
            ->map(fn ($items) => $items->flatMap(fn ($i) => $i->bypassed_requirements ?? [])->filter()->unique()->values()->toArray())
            ->toArray();

        $settings = SystemSetting::pluck('value', 'config_key')->toArray();

        $preloadedData = [
            'periode' => $periode,
            'completed_ids' => array_flip($completedIds),
            'active_reg_ids' => array_flip($activeRegIds),
            'dispensations' => $dispensations,
            'settings' => $settings,
        ];

        $eligible = [];
        $notEligible = [];

        foreach ($students as $student) {
            $result = $this->checkEligibility($student, $periodeId, $preloadedData);
            if ($result['is_eligible']) {
                $eligible[] = $result;
            } else {
                $notEligible[] = $result;
            }
        }

        return [
            'eligible' => collect($eligible)->sortBy('nama')->values(),
            'not_eligible' => collect($notEligible)->sortBy('nama')->values(),
            'total' => $students->count(),
            'eligible_count' => count($eligible),
            'not_eligible_count' => count($notEligible),
            'eligibility_rate' => $students->count() > 0
                ? round((count($eligible) / $students->count()) * 100, 1)
                : 0,
        ];
    }
}
