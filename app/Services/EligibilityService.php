<?php

namespace App\Services;

use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\SystemSetting;

class EligibilityService
{
    /**
     * Check if a student is eligible to register for KKN
     */
    public function checkEligibility(Mahasiswa $mahasiswa, ?int $periodeId = null): array
    {
        $periode = Periode::find($periodeId) ?? Periode::getActivePeriod();
        
        $checks = [
            'registration_window' => $this->checkRegistrationWindow($periode),
            'no_prior_completion' => $this->checkNoPriorCompletion($mahasiswa),
            'min_sks' => $this->checkMinimumSKS($mahasiswa),
            'min_gpa' => $this->checkMinimumGPA($mahasiswa),
            'bta_ppi' => $this->checkBtaPpi($mahasiswa),
            'documents' => $this->checkDocuments($mahasiswa),
            'no_active_registration' => $this->checkNoActiveRegistration($mahasiswa),
        ];

        $issues = array_filter($checks, fn($check) => !$check['passed']);
        
        return [
            'mahasiswa_id' => $mahasiswa->id,
            'nim' => $mahasiswa->nim,
            'nama' => $mahasiswa->nama,
            'sks_completed' => $mahasiswa->sks_completed,
            'gpa' => $mahasiswa->gpa,
            'is_bta_ppi_passed' => $mahasiswa->is_bta_ppi_passed,
            'has_health_certificate' => !empty($mahasiswa->health_certificate_path),
            'has_parent_permission' => !empty($mahasiswa->parent_permission_path),
            'checks' => $checks,
            'is_eligible' => empty($issues),
            'issues' => array_values($issues),
            'issue_count' => count($issues),
        ];
    }

    /**
     * Check registration window
     */
    private function checkRegistrationWindow(?Periode $periode): array
    {
        if (!$periode) {
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
    private function checkNoPriorCompletion(Mahasiswa $mahasiswa): array
    {
        $hasCompleted = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
            ->where('status', 'completed')
            ->exists();

        return [
            'passed' => !$hasCompleted,
            'key' => 'no_prior_completion',
            'message' => $hasCompleted 
                ? 'Sudah lulus KKN sebelumnya' 
                : 'Belum pernah lulus KKN',
        ];
    }

    /**
     * Check minimum SKS requirement
     */
    private function checkMinimumSKS(Mahasiswa $mahasiswa): array
    {
        $minSks = SystemSetting::get('min_sks_registration', 100);
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
    private function checkMinimumGPA(Mahasiswa $mahasiswa): array
    {
        $minGpaEnabled = SystemSetting::get('enable_gpa_requirement', false);
        
        if (!$minGpaEnabled) {
            return [
                'passed' => true,
                'key' => 'min_gpa',
                'message' => 'Validasi IPK tidak diaktifkan',
                'enabled' => false,
            ];
        }

        $minGpa = SystemSetting::get('min_gpa_registration', 2.00);
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
     * Check required documents
     */
    private function checkDocuments(Mahasiswa $mahasiswa): array
    {
        $hasHealthCert = !empty($mahasiswa->health_certificate_path);
        $hasParentPerm = !empty($mahasiswa->parent_permission_path);
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
    private function checkNoActiveRegistration(Mahasiswa $mahasiswa, ?int $currentPeriodeId = null): array
    {
        $query = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
            ->whereIn('status', ['pending', 'approved']);
        
        // FIX C3: Exclude current period to avoid false positives
        if ($currentPeriodeId) {
            $query->where('period_id', '!=', $currentPeriodeId);
        }
        
        $hasActive = $query->exists();

        return [
            'passed' => !$hasActive,
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
        $query = Mahasiswa::with(['user', 'prodi.fakultas', 'fakultas']);

        if ($facultyId) {
            $query->where('faculty_id', $facultyId);
        }

        $students = $query->get();

        $eligible = [];
        $notEligible = [];

        foreach ($students as $student) {
            $result = $this->checkEligibility($student, $periodeId);
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
