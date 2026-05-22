<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\HealthController;
use App\Http\Traits\ApiResponse;
use App\Services\TelegramAlertService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Admin Monitoring Dashboard — endpoint backend untuk halaman
 * /admin/monitoring.
 *
 * GET /admin/monitoring/overview
 *     Aggregate health + Telegram config status + recent alerts from cache
 *
 * GET /admin/monitoring/alerts
 *     Recent alert history (deduped in cache by TelegramAlertService)
 */
class MonitoringController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly TelegramAlertService $telegram) {}

    public function overview(Request $request): JsonResponse
    {
        // Use a sanitized, read-only health snapshot for the admin monitoring UI.
        $healthController = app(HealthController::class);
        $healthData = $healthController->monitoringSnapshot();

        // Queue stats (best-effort)
        $queue = [
            'pending_jobs' => 0,
            'failed_jobs' => 0,
        ];
        try {
            $queue['pending_jobs'] = DB::table('jobs')->count();
        } catch (\Throwable) {
            // ignored — table might not exist for non-db queues
        }
        try {
            $queue['failed_jobs'] = DB::table('failed_jobs')->count();
        } catch (\Throwable) {
            // ignored
        }

        // Last heartbeat timestamp from cache
        $lastHeartbeat = Cache::get('monitoring:telegram:last-heartbeat');
        $recentDedupKeys = [];
        foreach (['database', 'cache', 'redis', 'queue', 'failed_jobs', 'storage'] as $component) {
            $cacheKey = 'monitoring:telegram:last-alert:'.$component;
            $value = Cache::get($cacheKey);
            if ($value) {
                $recentDedupKeys[$component] = $value;
            }
        }

        // R13-API-008: standardize on ApiResponse envelope instead of raw response()->json.
        return $this->success([
            'health' => $healthData,
            'queue' => $queue,
            'telegram' => [
                'configured' => $this->telegram->isConfigured(),
                'last_heartbeat' => $lastHeartbeat,
                'recent_alerts' => $recentDedupKeys,
            ],
            'server' => [
                'app_version' => config('app.version', '4.0.0'),
            ],
        ]);
    }

    /**
     * Recent alert history — we combine several sources:
     *  - Telegram dedup cache (shows "last sent" per component)
     *  - Failed jobs table entries (recent errors)
     */
    public function alerts(Request $request): JsonResponse
    {
        $alerts = [];

        // From Telegram dedup cache
        foreach (['database', 'cache', 'redis', 'queue', 'failed_jobs', 'storage'] as $component) {
            $cacheKey = 'monitoring:telegram:last-alert:'.$component;
            $timestamp = Cache::get($cacheKey);
            if ($timestamp) {
                $alerts[] = [
                    'component' => $component,
                    'type' => 'telegram_alert',
                    'severity' => 'critical',
                    'last_sent_at' => $timestamp,
                    'source' => 'telegram_dedup_cache',
                ];
            }
        }

        // From failed_jobs (most recent 20)
        try {
            $failedJobs = DB::table('failed_jobs')
                ->orderByDesc('failed_at')
                ->limit(20)
                ->get(['uuid', 'connection', 'queue', 'exception', 'failed_at']);

            foreach ($failedJobs as $j) {
                $excerpt = mb_substr((string) ($j->exception ?? ''), 0, 200);
                $alerts[] = [
                    'component' => 'job:'.$j->queue,
                    'type' => 'failed_job',
                    'severity' => 'warning',
                    'last_sent_at' => $j->failed_at,
                    'source' => 'failed_jobs_table',
                    'details' => $excerpt,
                    'uuid' => $j->uuid,
                ];
            }
        } catch (\Throwable) {
            // failed_jobs table may not exist
        }

        // Sort newest first after normalizing mixed timestamp formats.
        usort(
            $alerts,
            fn ($a, $b) => $this->toUnixTimestamp($b['last_sent_at'] ?? null) <=> $this->toUnixTimestamp($a['last_sent_at'] ?? null)
        );

        return $this->success(array_values($alerts));
    }

    /**
     * Manual trigger health check now — sends Telegram if issues found.
     */
    public function triggerCheck(Request $request): JsonResponse
    {
        $exitCode = Artisan::call('monitoring:health-check');
        $output = Artisan::output();

        $payload = [
            'exit_code' => $exitCode,
            'output' => trim($output),
            'checked_at' => now()->toIso8601String(),
        ];

        if ($exitCode === 0) {
            return $this->success($payload, 'Health check berhasil dijalankan.');
        }

        return $this->error(
            'HEALTH_CHECK_FAILED',
            'Health check mendeteksi masalah atau gagal mengirim alert. Cek log server / Telegram.',
            503,
            ['output' => [$payload['output']]]
        );
    }

    private function toUnixTimestamp(mixed $value): int
    {
        if (! is_string($value) || trim($value) === '') {
            return 0;
        }

        $timestamp = strtotime($value);

        return $timestamp === false ? 0 : $timestamp;
    }
}
