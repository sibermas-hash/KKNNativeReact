<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\KKN\Periode;
use App\Services\RedisCacheService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class AutoSyncPeriodePhase extends Command
{
    protected $signature = 'kkn:auto-sync-phase {--dry-run : Show what would be changed without actually changing}';

    protected $description = 'Automatically sync periode phase based on dates (cron job)';

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $now = now();

        $this->info("Starting auto phase sync at {$now}...");

        $periods = Periode::where('is_active', true)
            ->whereNotNull('current_phase')
            ->get();

        if ($periods->isEmpty()) {
            $totalPeriods = Periode::count();
            $activePeriods = Periode::where('is_active', true)->count();
            $this->warn('No active periods found with valid phase.');
            $this->info("Total periods: {$totalPeriods}, Active periods: {$activePeriods}");
            $this->info("Make sure periods have 'is_active=true' AND 'current_phase' is not null.");

            return self::SUCCESS;
        }

        $changed = 0;
        $skipped = 0;

        foreach ($periods as $period) {
            $currentPhase = $period->current_phase;
            $nextPhase = $this->getNextPhase($currentPhase);

            if (! $nextPhase) {
                $skipped++;

                continue;
            }

            $triggerDate = $this->getTriggerDate($period, $currentPhase);

            if (! $triggerDate) {
                $skipped++;

                continue;
            }

            $shouldTransition = $now->gte($triggerDate);

            if ($dryRun) {
                $this->line("Period {$period->id} ({$period->name}): {$currentPhase} -> {$nextPhase} (trigger: {$triggerDate}) ".($shouldTransition ? '[WOULD CHANGE]' : '[WAITING]'));
            } elseif ($shouldTransition) {
                $period->update(['current_phase' => $nextPhase]);
                $this->info("Period {$period->id}: {$currentPhase} -> {$nextPhase}");
                Log::info('Auto phase transition', [
                    'periode_id' => $period->id,
                    'periode_name' => $period->name,
                    'from' => $currentPhase,
                    'to' => $nextPhase,
                ]);
                $changed++;
            } else {
                $skipped++;
            }
        }

        if (! $dryRun) {
            $this->info("Completed. Changed: {$changed}, Skipped: {$skipped}");

            if ($changed > 0) {
                $this->clearCache();
            }
        }

        return self::SUCCESS;
    }

    private function getNextPhase(string $currentPhase): ?string
    {
        return match ($currentPhase) {
            'upcoming' => 'registration',
            'registration' => 'placement',
            'placement' => 'execution',
            'execution' => 'grading',
            'grading' => 'finished',
            'finished' => null,
            default => null,
        };
    }

    private function getTriggerDate(Periode $period, string $currentPhase): ?Carbon
    {
        // C-04 fix: trigger date = when the NEXT phase should START
        // upcoming→registration: fires at registration_start
        // registration→placement: fires at registration_end
        // placement→execution: fires at start_date (KKN execution start)
        // execution→grading: fires at end_date (KKN execution end)
        // grading→finished: fires at grading_end
        return match ($currentPhase) {
            'upcoming' => $period->registration_start,
            'registration' => $period->registration_end,
            'placement' => $period->start_date,
            'execution' => $period->end_date,
            'grading' => $period->grading_end,
            default => null,
        };
    }

    private function clearCache(): void
    {
        try {
            RedisCacheService::invalidateMasterData();
            Cache::forget('default_periode_id');
            Cache::forget('available_periods');
            Cache::forget('periode_program_options');
        } catch (\Exception $e) {
            $this->warn("Cache clear failed: {$e->getMessage()}");
        }
    }
}
