<?php

namespace Database\Seeders;

use App\Models\KKN\DplPeriod;
use App\Models\KKN\KelompokKkn;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MigrateDplPeriodDataSeeder extends Seeder
{
    /**
     * Migrate existing dpl_id assignments on kelompok_kkn to dpl_periods pivot table.
     * This is a one-time data migration, safe to run multiple times (idempotent).
     */
    public function run(): void
    {
        $this->command->info('Starting DPL Period data migration...');

        // Get all unique dpl_id + periode_id combinations from existing groups
        $existingAssignments = DB::table('kelompok_kkn')
            ->select('dpl_id', 'periode_id')
            ->whereNotNull('dpl_id')
            ->whereNull('deleted_at')
            ->distinct()
            ->get();

        $created = 0;
        $skipped = 0;

        foreach ($existingAssignments as $assignment) {
            // Count how many groups this DPL has in this period
            $groupCount = KelompokKkn::where('dpl_id', $assignment->dpl_id)
                ->where('periode_id', $assignment->periode_id)
                ->count();

            // Create DplPeriod if it doesn't exist
            $dplPeriod = DplPeriod::firstOrCreate(
                [
                    'dosen_id' => $assignment->dpl_id,
                    'periode_id' => $assignment->periode_id,
                ],
                [
                    'max_groups' => max(5, $groupCount + 2), // Allow some room
                    'is_active' => true,
                ]
            );

            if ($dplPeriod->wasRecentlyCreated) {
                $created++;
            } else {
                $skipped++;
            }

            // Update groups to reference the dpl_period
            KelompokKkn::where('dpl_id', $assignment->dpl_id)
                ->where('periode_id', $assignment->periode_id)
                ->whereNull('dpl_periode_id')
                ->update(['dpl_periode_id' => $dplPeriod->id]);
        }

        $this->command->info("Migration complete: {$created} created, {$skipped} already existed.");
    }
}
