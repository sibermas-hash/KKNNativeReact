<?php

namespace App\Jobs;

use App\Models\KKN\NilaiKkn;
use App\Notifications\ScorePublished;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class FinalizeMassScoresJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

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

        NilaiKkn::whereHas('kelompok', function ($query) {
            $query->where('period_id', $this->periodId);
        })
        ->where('is_finalized', false)
        ->whereNotNull('total_score')
        ->with('mahasiswa.user')
        ->chunk(100, function ($scores) use (&$processed, &$failed, &$totalFinalized) {
            $studentIds = $scores->pluck('mahasiswa_id');
            $groupIds = $scores->pluck('kelompok_id')->unique();
            
            $reports = \App\Models\KKN\LaporanAkhir::whereIn('mahasiswa_id', $studentIds)
                ->whereIn('kelompok_id', $groupIds)
                ->get()
                ->groupBy(fn($r) => $r->mahasiswa_id . '|' . $r->kelompok_id);

            foreach ($scores as $score) {
                try {
                    $lookupKey = $score->mahasiswa_id . '|' . $score->kelompok_id;
                    $report = $reports->get($lookupKey)?->first();

                    if (!$report || $report->status !== 'approved') {
                        $failed++;
                    } else {
                        $score->is_finalized = true;
                        $score->save();
                        $totalFinalized++;
                        
                        // Notify student
                        $score->mahasiswa->user->notify(new ScorePublished($score));
                    }
                } catch (\Exception $e) {
                    Log::error("Failed to finalize score ID {$score->id}: " . $e->getMessage());
                }

                $processed++;
                \Illuminate\Support\Facades\Cache::put("finalize_progress_{$this->periodId}", [
                    'processed' => $processed,
                    'status' => 'processing',
                ], 3600);
            }
        });

        \Illuminate\Support\Facades\Cache::put("finalize_progress_{$this->periodId}", [
            'processed' => $processed,
            'status' => 'completed',
            'finished_at' => now(),
        ], 3600);

        \App\Services\AuditService::log(
            'MASS_FINALIZE_COMPLETED',
            "Finalisasi massal selesai untuk Periode ID: {$this->periodId}. Total diproses: {$processed}, Berhasil: {$totalFinalized}, Dilewati (Laporan belum disetujui): {$failed}",
            null,
            ['period_id' => $this->periodId]
        );

        Log::info("Completed mass finalization for period ID: {$this->periodId}");
    }
}