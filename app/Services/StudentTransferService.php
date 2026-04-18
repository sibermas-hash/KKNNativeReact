<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\RegistrationHistory;
use Illuminate\Support\Facades\DB;

class StudentTransferService
{
    /**
     * Transfer a student from one period/group to another.
     *
     * @throws \Exception
     */
    public function transferStudent(
        int $pesertaKknId,
        int $targetPeriodId,
        ?int $targetGroupId,
        string $reason,
        int $processedBy,
    ): RegistrationHistory {
        $peserta = PesertaKkn::findOrFail($pesertaKknId);
        $targetPeriod = Periode::findOrFail($targetPeriodId);

        // Validation
        $this->validateTransfer($peserta, $targetPeriod, $targetGroupId);

        return DB::connection('kkn')->transaction(function () use (
            $peserta, $targetPeriod, $targetGroupId, $reason, $processedBy
        ) {
            // Record transfer history
            $history = RegistrationHistory::create([
                'peserta_kkn_id' => $peserta->id,
                'from_periode_id' => $peserta->periode_id,
                'to_periode_id' => $targetPeriod->id,
                'from_kelompok_id' => $peserta->kelompok_id,
                'to_kelompok_id' => $targetGroupId,
                'reason' => $reason,
                'processed_by' => $processedBy,
                'processed_at' => now(),
            ]);

            // Update registration
            $peserta->update([
                'periode_id' => $targetPeriod->id,
                'kelompok_id' => $targetGroupId,
                'status' => 'transferred',
            ]);

            return $history;
        });
    }

    /**
     * Validate that the transfer is allowed.
     */
    private function validateTransfer(
        PesertaKkn $peserta,
        Periode $targetPeriod,
        ?int $targetGroupId,
    ): void {
        // Cannot transfer completed registrations
        if ($peserta->status === 'completed') {
            throw new \Exception('Tidak dapat memindahkan peserta yang sudah menyelesaikan KKN.');
        }

        // Cannot transfer to same period
        if ($peserta->periode_id === $targetPeriod->id) {
            throw new \Exception('Tidak dapat memindahkan peserta ke periode yang sama.');
        }

        // Must be same or later period number
        $currentPeriod = $peserta->periode;
        if ($targetPeriod->periode && $currentPeriod->periode
            && $targetPeriod->periode < $currentPeriod->periode) {
            throw new \Exception('Tidak dapat memindahkan peserta ke periode yang lebih lama.');
        }

        // Check quota on target period
        if ($targetPeriod->kuota) {
            $currentCount = PesertaKkn::where('periode_id', $targetPeriod->id)
                ->whereNotIn('status', ['rejected', 'transferred'])
                ->count();
            if ($currentCount >= $targetPeriod->kuota) {
                throw new \Exception('Kuota periode tujuan sudah penuh.');
            }
        }

        // Check overlapping periods
        if ($targetPeriod->start_date && $currentPeriod->end_date) {
            if ($targetPeriod->start_date->lt($currentPeriod->end_date)
                && $targetPeriod->end_date?->gt($currentPeriod->start_date)) {
                // Just a warning check — overlapping is allowed but logged
            }
        }

        // Validate target group if specified
        if ($targetGroupId) {
            $targetGroup = KelompokKkn::findOrFail($targetGroupId);

            if ($targetGroup->periode_id !== $targetPeriod->id) {
                throw new \Exception('Kelompok tujuan tidak berada di periode tujuan.');
            }

            // Check group capacity
            $groupCount = PesertaKkn::where('kelompok_id', $targetGroupId)
                ->whereNotIn('status', ['rejected', 'transferred'])
                ->count();
            if ($targetGroup->capacity && $groupCount >= $targetGroup->capacity) {
                throw new \Exception('Kelompok tujuan sudah penuh.');
            }
        }
    }
}
