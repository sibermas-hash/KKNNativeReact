<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\KKN\KegiatanKkn;
use App\Services\AI\LogbookAnalyzer;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\Log;

/**
 * ProcessActivityAiAnalysis — async AI analysis untuk laporan harian KKN.
 *
 * Dipanggil otomatis dari `KegiatanKkn::booted()` saat create (via `defer()`)
 * atau manual via `ProcessActivityAiAnalysis::dispatch($kegiatan)`.
 *
 * Memakai `LogbookAnalyzer` service yang pakai SumoPod 3-tier failover.
 * Hasil analisis disimpan ke `kegiatan_kkn.ai_summary` + `ai_analysis` (JSON).
 *
 * Auto-flag behavior:
 *   - Jika AI `flagged=true` ATAU `quality_score < 3` → set status kegiatan
 *     ke 'revision' dengan review_notes auto-generated (hanya jika status
 *     saat ini masih draft/submitted — tidak override approved).
 *   - Hanya runtime production. Di testing, job tetap dispatch tapi
 *     karena ada `app()->environment('testing')` guard di model, di-skip.
 */
class ProcessActivityAiAnalysis implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $maxExceptions = 2;

    public int $backoff = 30; // seconds between retries

    public function __construct(public KegiatanKkn $activity) {}

    public function handle(LogbookAnalyzer $analyzer): void
    {
        Context::add('activity_id', $this->activity->id);

        try {
            $result = $analyzer->analyzeEntry($this->activity);

            if (! $result['success']) {
                Log::warning('AI analysis unavailable for kegiatan', [
                    'activity_id' => $this->activity->id,
                    'error' => $result['error'],
                ]);

                return;
            }

            $updates = [
                'ai_summary' => $result['summary'],
                'ai_analysis' => [
                    'quality_score' => $result['quality_score'],
                    'abcd_compliance' => $result['abcd_compliance'],
                    'flagged' => $result['flagged'],
                    'flag_reason' => $result['flag_reason'],
                    'feedback' => $result['feedback'],
                    'tags' => $result['tags'],
                    'provider_used' => $result['provider_used'],
                    'analyzed_at' => now()->toIso8601String(),
                ],
            ];

            // Auto-flag: jika AI flag atau quality rendah, set ke revision
            // HANYA jika status sekarang belum 'approved' (tidak override DPL decision)
            $shouldAutoFlag = $result['flagged'] || $result['quality_score'] < 3;
            $currentStatus = $this->activity->canonicalStatus();

            if ($shouldAutoFlag && in_array($currentStatus, [KegiatanKkn::STATUS_DRAFT, KegiatanKkn::STATUS_SUBMITTED], true)) {
                $updates['status'] = KegiatanKkn::STATUS_REVISION;

                $reasonLine = $result['flagged']
                    ? ($result['flag_reason'] ?? 'AI menandai laporan ini perlu review.')
                    : sprintf('Kualitas narasi rendah (AI quality score: %d/10).', $result['quality_score']);

                $updates['review_notes'] = sprintf(
                    "🤖 [AI Auto-Review]\n%s\n\nSaran: %s\n\nCatatan: Laporan ini di-flag oleh sistem AI. DPL dapat override keputusan ini.",
                    $reasonLine,
                    $result['feedback'] ?: 'Tidak ada saran spesifik.'
                );

                Log::info('Kegiatan auto-flagged for revision by AI', [
                    'activity_id' => $this->activity->id,
                    'reason' => $result['flagged'] ? 'ai_flagged' : 'low_quality',
                    'quality_score' => $result['quality_score'],
                ]);
            }

            $this->activity->update($updates);

            Log::info('AI analysis completed for kegiatan', [
                'activity_id' => $this->activity->id,
                'provider' => $result['provider_used'],
                'quality_score' => $result['quality_score'],
                'abcd_compliance' => $result['abcd_compliance'],
                'flagged' => $result['flagged'],
                'auto_flagged' => $shouldAutoFlag && in_array($currentStatus, [KegiatanKkn::STATUS_DRAFT, KegiatanKkn::STATUS_SUBMITTED], true),
            ]);
        } catch (\Throwable $e) {
            Log::error('AI analysis job threw exception', [
                'activity_id' => $this->activity->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * R13-API-006: final failure hook — records the exhausted-retry outcome
     * so observability captures the activity_id even after retries.
     */
    public function failed(\Throwable $e): void
    {
        Log::error('ProcessActivityAiAnalysis exhausted retries', [
            'activity_id' => $this->activity->id,
            'error' => $e->getMessage(),
        ]);
    }
}
