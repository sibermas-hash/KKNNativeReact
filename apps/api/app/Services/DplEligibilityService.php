<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\Dosen;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\PesertaWorkshop;

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
     * Additional: Cannot be DPL for multiple active KKN periods at once.
     */
    public function isQualifiedForDpl(Dosen $dosen, ?int $periodId = null): array
    {
        // Check administrative baseline first
        $baseCheck = $this->canAttendWorkshop($dosen);
        if (! $baseCheck['eligible']) {
            return $baseCheck;
        }

        if (blank($dosen->nidn)) {
            return [
                'eligible' => false,
                'reason' => 'Dosen wajib memiliki NIDN untuk ditugaskan sebagai DPL.',
            ];
        }

        $hasPassedWorkshop = PesertaWorkshop::where('user_id', $dosen->user_id)
            ->where('is_passed', true)
            ->where('attendance_status', 'attended')
            ->exists();

        if (! $hasPassedWorkshop) {
            return [
                'eligible' => false,
                'reason' => 'Dosen belum tercatat hadir dan lulus Workshop Pembekalan DPL.',
            ];
        }

        // Check if Dosen is already active DPL for another KKN period (cannot have double job)
        if ($periodId) {
            $activeOtherPeriods = DplPeriod::where('dosen_id', $dosen->id)
                ->where('periode_id', '!=', $periodId)
                ->where('is_active', true)
                ->whereIn('status', ['approved', 'active'])
                ->count();

            if ($activeOtherPeriods > 0) {
                return [
                    'eligible' => false,
                    'reason' => 'Dosen sudah aktif sebagai DPL di periode KKN lain.',
                ];
            }
        }

        return [
            'eligible' => true,
            'reason' => 'Dosen memenuhi kriteria untuk ditugaskan sebagai DPL.',
        ];
    }
}
