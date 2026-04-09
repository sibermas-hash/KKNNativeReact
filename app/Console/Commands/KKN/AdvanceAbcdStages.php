<?php

namespace App\Console\Commands\KKN;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\ProgramKerja;
use App\Services\KKN\AbcdReportingService;
use Illuminate\Console\Command;

class AdvanceAbcdStages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'kkn:advance-abcd';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically evaluate and advance ABCD stages for all active KKN groups based on their logbooks and progress.';

    /**
     * Execute the console command.
     */
    public function handle(AbcdReportingService $abcdService)
    {
        $this->info("Scanning active groups for stage advancement...");

        $groups = KelompokKkn::where('status', 'active')
            ->whereHas('periode', fn($q) => $q->where('is_active', true))
            ->get();
        $count = 0;

        foreach ($groups as $group) {
            // Process ALL work programs per group (not just the first)
            $progkerList = ProgramKerja::where('kelompok_id', $group->id)->get();
            
            if ($progkerList->isEmpty()) {
                continue;
            }

            foreach ($progkerList as $progker) {
                // Attempt to move to next stage if eligible
                $status = $abcdService->canAdvance($progker->id);
                if ($status['can_advance']) {
                    $oldStage = $progker->abcd_stage->value;
                    $success = $abcdService->advance($progker->id);
                    
                    if ($success) {
                        $progker->refresh();
                        $this->info("Group {$group->nama_kelompok} / Progker #{$progker->id} advanced from {$oldStage} to {$progker->abcd_stage->value}");
                        $count++;
                    }
                }
            }
        }

        $this->info("Completed. $count work programs advanced.");
    }
}
