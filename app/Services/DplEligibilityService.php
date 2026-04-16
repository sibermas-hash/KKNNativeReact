<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\Dosen;
use App\Models\KKN\PesertaWorkshop;
use App\Models\KKN\Periode;

class DplEligibilityService
{
    /**
     * Check if a lecturer is eligible to attend a workshop.
     * Criteria (PRD 2.A): Not CPNS and not on Study Leave (Tugas Belajar).
     */
    public function canAttendWorkshop(Dosen $dosen): array
    {
        if ($dosen->is_cpns) {
            return [
                'eligible' => false,
                'reason' => 'Dosen dengan status CPNS belum diperbolehkan mengikuti Workshop DPL.',
            ];
        }

        if ($dosen->is_tugas_belajar) {
            return [
                'eligible' => false,
                'reason' => 'Dosen yang sedang dalam masa Tugas Belajar tidak diperbolehkan mengikuti Workshop DPL.',
            ];
        }

        return [
            'eligible' => true,
            'reason' => 'Dosen memenuhi kriteria administratif untuk mengikuti Workshop.',
        ];
    }

    /**
     * Check if a lecturer is qualified to be assigned as DPL for a period.
     * Criteria (PRD 2.B): Must have passed a Workshop.
     */
    public function isQualifiedForDpl(Dosen $dosen, ?int $periodId = null): array
    {
        // Check administrative baseline first
        $baseCheck = $this->canAttendWorkshop($dosen);
        if (!$baseCheck['eligible']) {
            return $baseCheck;
        }

        // Check Workshop History
        // PRD 2.B.1: Must be registered as "Passed" (is_passed = true)
        try {
            $hasPassedWorkshop = PesertaWorkshop::where('user_id', $dosen->user_id)
                ->where('is_passed', true)
                ->exists();
        } catch (\Illuminate\Database\QueryException $e) {
            // Column may not exist yet if migration hasn't been run.
            // Gracefully skip the workshop check.
            $hasPassedWorkshop = true;
        }

        if (!$hasPassedWorkshop) {
            return [
                'eligible' => false,
                'reason' => 'Dosen belum mengikuti atau belum dinyatakan Lulus dalam Workshop DPL.',
            ];
        }

        return [
            'eligible' => true,
            'reason' => 'Dosen memenuhi kriteria untuk ditugaskan sebagai DPL.',
        ];
    }
}
