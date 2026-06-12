<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\KKN\Mahasiswa;
use App\Services\EligibilityService;
use Illuminate\Console\Command;

class RecomputeEligibilityCommand extends Command
{
    protected $signature = 'audit:recompute-eligibility
                            {--chunk=500 : Chunk size for batch processing}
                            {--faculty= : Only recompute for a specific faculty ID}';

    protected $description = 'Batch recompute eligibility cache for all mahasiswa (fast DB-level caching)';

    public function handle(EligibilityService $service): int
    {
        $this->info('Recomputing eligibility cache...');

        $query = Mahasiswa::query();
        if ($fid = $this->option('faculty')) {
            $query->where('fakultas_id', (int) $fid);
        }

        $total = $query->count();
        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $eligible = 0;
        $notEligible = 0;
        $chunk = (int) $this->option('chunk');

        // Pre-load shared data once
        $result = $service->getEligibleStudents(null, $this->option('faculty') ? (int) $this->option('faculty') : null);

        // Index results by mahasiswa_id for O(1) lookup
        $allResults = [];
        foreach ($result['eligible'] as $r) {
            $allResults[$r['mahasiswa_id']] = ['is_eligible' => true, 'issues' => []];
        }
        foreach ($result['not_eligible'] as $r) {
            $allResults[$r['mahasiswa_id']] = [
                'is_eligible' => false,
                'issues' => array_map(fn ($i) => ['key' => $i['key'], 'message' => $i['message']], $r['issues']),
            ];
        }

        // Batch update in chunks via raw SQL for speed
        $now = now()->toDateTimeString();
        $query->select('id')->chunkById($chunk, function ($rows) use (&$eligible, &$notEligible, $allResults, $bar, $now) {
            $eligibleIds = [];
            $notEligibleIds = [];
            $issuesMap = [];

            foreach ($rows as $row) {
                $cached = $allResults[$row->id] ?? null;
                if ($cached && $cached['is_eligible']) {
                    $eligibleIds[] = $row->id;
                    $eligible++;
                } else {
                    $notEligibleIds[] = $row->id;
                    $notEligible++;
                    if ($cached) {
                        $issuesMap[$row->id] = $cached['issues'];
                    }
                }
                $bar->advance();
            }

            // Batch update eligible
            if ($eligibleIds) {
                Mahasiswa::whereIn('id', $eligibleIds)->update([
                    'is_eligible' => true,
                    'eligibility_issues' => json_encode([]),
                    'eligibility_computed_at' => $now,
                ]);
            }

            // Batch update not eligible — need individual issues
            foreach ($notEligibleIds as $id) {
                Mahasiswa::where('id', $id)->update([
                    'is_eligible' => false,
                    'eligibility_issues' => json_encode($issuesMap[$id] ?? []),
                    'eligibility_computed_at' => $now,
                ]);
            }
        });

        $bar->finish();
        $this->newLine(2);
        $this->info("Done! Eligible: {$eligible} | Not eligible: {$notEligible} | Total: {$total}");
        $rate = $total > 0 ? round($eligible / $total * 100, 1) : 0;
        $this->info("Eligibility rate: {$rate}%");

        return self::SUCCESS;
    }
}
