<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\KKN\LaporanAkhir;
use App\Models\KKN\NilaiKkn;
use App\Notifications\ScorePublished;
use App\Services\AuditService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FinalizeMassScoresJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Re-audit 2026-05-10 H-004: retry policy added. Mass score finalization
     * calls GradingService::updateUnifiedScore for each student; transient
     * DB deadlocks should retry rather than abort the whole batch.
     */
    public int $tries = 3;

    public array $backoff = [15, 60, 300];

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 600;

    /**
     * Create a new job instance.
     */
    public function __construct(
        private int $periodId,
        private ?int $adminId = null
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info("Starting mass finalization for period ID: {$this->periodId}");

        $processed = 0;
        $failed = 0;
        $totalFinalized = 0;

        // FIX C6: Use chunkById instead of chunk to prevent skipping/duplicating records
        NilaiKkn::whereHas('kelompok', function ($query) {
            $query->where('periode_id', $this->periodId);
        })
            ->where('is_finalized', false)
            ->whereNotNull('total_score')
            ->with('mahasiswa.user')
            ->orderBy('id')
            ->chunkById(100, function ($scores) use (&$processed, &$failed, &$totalFinalized) {
                // Wrap each chunk in a transaction for atomicity
                DB::transaction(function () use ($scores, &$processed, &$failed, &$totalFinalized) {
                    $studentIds = $scores->map(fn ($score) => $score->mahasiswa?->id)->filter()->unique();
                    $groupIds = $scores->pluck('kelompok_id')->unique();

                    $reports = LaporanAkhir::whereIn('mahasiswa_id', $studentIds)
                        ->whereIn('kelompok_id', $groupIds)
                        ->get()
                        ->groupBy(fn ($r) => $r->mahasiswa_id.'|'.$r->kelompok_id);

                    $notifyQueue = []; // Collect notifications, send after transaction

                    foreach ($scores as $score) {
                        try {
                            if (! $score->mahasiswa) {
                                $failed++;
                                $processed++;

                                continue;
                            }

                            $lookupKey = $score->mahasiswa->id.'|'.$score->kelompok_id;
                            $report = $reports->get($lookupKey)?->first();

                            if (! $report || ! $report->isApproved()) {
                                $failed++;
                            } else {
                                $lockedScore = NilaiKkn::where('id', $score->id)
                                    ->where('is_finalized', false)
                                    ->lockForUpdate()
                                    ->first();

                                if (! $lockedScore) {
                                    Log::warning("Score ID {$score->id} already finalized or locked, skipping.");
                                    $failed++;
                                    $processed++;

                                    continue;
                                }

                                $lockedScore->is_finalized = true;
                                $lockedScore->save();
                                $totalFinalized++;

                                if ($score->mahasiswa->user) {
                                    $notifyQueue[] = [$score->mahasiswa->user, $score];
                                }
                            }
                        } catch (\Exception $e) {
                            Log::error("Failed to finalize score ID {$score->id}: ".$e->getMessage());
                            $failed++;
                        }

                        $processed++;
                        Cache::put("finalize_progress_{$this->periodId}", [
                            'processed' => $processed,
                            'status' => 'processing',
                        ], 3600);
                    }

                    // Send notifications in batch after transaction commits
                    foreach ($notifyQueue as [$user, $score]) {
                        try {
                            $user->notify(new ScorePublished($score));
                        } catch (\Exception $e) {
                            Log::warning("Failed to notify user {$user->id}: ".$e->getMessage());
                        }
                    }
                });
            });

        Cache::put("finalize_progress_{$this->periodId}", [
            'processed' => $processed,
            'total_failed' => $failed,
            'total_finalized' => $totalFinalized,
            'status' => 'completed',
            'finished_at' => now(),
        ], 3600);

        AuditService::log(
            'MASS_FINALIZE_COMPLETED',
            "Finalisasi massal selesai untuk Periode ID: {$this->periodId}. Total diproses: {$processed}, Berhasil: {$totalFinalized}, Gagal: {$failed}",
            null,
            ['periode_id' => $this->periodId],
            ['processed' => $processed, 'finalized' => $totalFinalized, 'failed' => $failed]
        );

        Log::info("Completed mass finalization for period ID: {$this->periodId}. Processed: {$processed}, Finalized: {$totalFinalized}, Failed: {$failed}");
    }

    /**
     * R13-API-006: explicit failure handler so the progress cache key flips
     * from 'processing' → 'failed' when retries are exhausted. Without this,
     * the admin UI sees an infinite spinner because it only checks the
     * cache-set status.
     */
    public function failed(\Throwable $e): void
    {
        Cache::put("finalize_progress_{$this->periodId}", [
            'status' => 'failed',
            'error' => $e->getMessage(),
            'finished_at' => now(),
        ], 3600);

        AuditService::log(
            'MASS_FINALIZE_FAILED',
            "Finalisasi massal GAGAL untuk Periode ID: {$this->periodId}: {$e->getMessage()}",
            null,
            ['periode_id' => $this->periodId],
            ['error' => $e->getMessage()],
        );

        Log::error("FinalizeMassScoresJob failed for period {$this->periodId}: ".$e->getMessage());
    }
}
