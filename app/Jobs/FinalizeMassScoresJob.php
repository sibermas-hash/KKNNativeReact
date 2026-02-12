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

        NilaiKkn::whereHas('kelompok', function ($query) {
            $query->where('periode_id', $this->periodId);
        })
        ->where('is_finalized', false)
        ->whereNotNull('total_score')
        ->with('mahasiswa.user')
        ->chunk(100, function ($scores) {
            foreach ($scores as $score) {
                try {
                    $score->update(['is_finalized' => true]);
                    
                    // Notify student
                    $score->mahasiswa->user->notify(new ScorePublished($score));
                } catch (\Exception $e) {
                    Log::error("Failed to finalize score ID {$score->id}: " . $e->getMessage());
                }
            }
        });

        Log::info("Completed mass finalization for period ID: {$this->periodId}");
    }
}
