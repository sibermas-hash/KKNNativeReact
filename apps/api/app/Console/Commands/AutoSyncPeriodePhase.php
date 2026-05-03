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

    private const PHASE_TRANSITIONS = [
        'registration' => 'registration_end',
        'placement' => 'end_date',
        'execution' => 'end_date',
        'grading' => 'grading_end',
        'finished' => 'finished',
    ];

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $now = now();

        $this->info("Starting auto phase sync at {$now}...");

        $periods = Periode::where('is_active', true)
            ->whereNotNull('current_phase')
            ->get();

        if ($periods->isEmpty()) {
            $this->info('No active periods found.');

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
        $phase = $currentPhase === 'upcoming' ? 'registration' : $currentPhase;

        return match ($phase) {
            'registration' => $period->registration_start,
            'placement' => $period->registration_end,
            'execution' => $period->start_date,
            'grading' => $period->end_date,
            'finished' => $period->grading_end,
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
