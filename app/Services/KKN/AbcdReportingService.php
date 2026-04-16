<?php

declare(strict_types=1);

namespace App\Services\KKN;

use App\Enums\AbcdStage;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\ProgramKerja;

class AbcdReportingService
{
    /**
     * Get progression of the ABCD stages (Discovery to Reflection)
     * as defined in Section 4 of document.
     */
    public function stages(): array
    {
        return [
            AbcdStage::DISCOVERY,
            AbcdStage::DREAM,
            AbcdStage::DESIGN,
            AbcdStage::DEFINE,
            AbcdStage::DESTINY,
            AbcdStage::REFLECTION,
        ];
    }

    /**
     * Determine if a group can advance to the next stage.
     * Logic: Stage N+1 requires sufficient activities (logbooks) in Stage N.
     */
    public function canAdvance(int $programId): array
    {
        $program = ProgramKerja::with('kelompok')->findOrFail($programId);
        $currentStage = $program->abcd_stage;

        $nextStage = $this->getNextStage($currentStage);
        if (! $nextStage) {
            return ['can_advance' => false, 'reason' => 'Tahapan terakhir (Reflection) sudah tercapai.'];
        }

        // Logic check: Minimum activities submitted in current stage
        $activitiesCount = KegiatanKkn::where('kelompok_id', $program->kelompok_id)
            ->where('status', 'approved')
            ->count();

        // Dynamic threshold based on stage week
        $threshold = $currentStage->weekNumber() * 7;

        if ($activitiesCount < $threshold) {
            return [
                'can_advance' => false,
                'reason' => "Minimal butuh {$threshold} aktivitas terverifikasi untuk melanjutkan ke tahap {$nextStage->label()}.",
            ];
        }

        return ['can_advance' => true, 'next_stage' => $nextStage];
    }

    /**
     * Advance the program to the next stage.
     */
    public function advance(int $programId): bool
    {
        $status = $this->canAdvance($programId);
        if (! $status['can_advance']) {
            return false;
        }

        $program = ProgramKerja::findOrFail($programId);
        $program->update(['abcd_stage' => $status['next_stage']]);

        return true;
    }

    private function getNextStage(AbcdStage $current): ?AbcdStage
    {
        $stages = $this->stages();
        foreach ($stages as $index => $stage) {
            if ($stage === $current && isset($stages[$index + 1])) {
                return $stages[$index + 1];
            }
        }

        return null;
    }
}
