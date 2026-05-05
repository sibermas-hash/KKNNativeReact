<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Ai\Agents\ActivityReviewerAgent;
use App\Models\KKN\KegiatanKkn;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\Log;

class ProcessActivityAiAnalysis implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public int $maxExceptions = 2;

    /**
     * Create a new job instance.
     */
    public function __construct(public KegiatanKkn $activity)
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(ActivityReviewerAgent $agent): void
    {
        // LARAVEL 13 OPTIMIZATION: Use Context to track activity in logs across the lifecycle
        Context::add('activity_id', $this->activity->id);

        try {
            $prompt = sprintf(
                "Judul: %s\nTahapan ABCD: %s\nAktivitas: %s\nRefleksi: %s",
                $this->activity->title,
                $this->activity->abcd_stage,
                $this->activity->activity,
                $this->activity->reflection
            );

            $response = $agent->prompt($prompt);
            $result = $response->toArray();

            $this->activity->update([
                'ai_summary' => $result['summary'],
                'ai_analysis' => $result, // Store the full structured JSON
            ]);

            Log::info("AI Analysis completed for Activity ID: {$this->activity->id}");
        } catch (\Exception $e) {
            Log::error("AI Analysis failed for Activity ID: {$this->activity->id}. Error: ".$e->getMessage());
            throw $e;
        }
    }
}
