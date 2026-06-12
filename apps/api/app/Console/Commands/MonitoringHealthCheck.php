<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\TelegramAlertService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

/**
 * monitoring:health-check — periodic health probe dengan Telegram alerting.
 *
 * Dijalankan via scheduler (setiap 5 menit). Kalau ada issue, kirim alert ke Telegram,
 * tapi dengan anti-spam throttling: same-alert tidak dikirim ulang dalam 30 menit
 * (dedup key stored in cache).
 *
 * Usage:
 *   php artisan monitoring:health-check             # kirim alert jika ada issue
 *   php artisan monitoring:health-check --force     # force send even if cached
 *   php artisan monitoring:health-check --heartbeat # juga kirim OK heartbeat
 */
class MonitoringHealthCheck extends Command
{
    protected $signature = 'monitoring:health-check
                            {--force : Abaikan dedup cache, kirim alert bahkan kalau baru saja dikirim}
                            {--heartbeat : Kirim heartbeat "all ok" walaupun tidak ada issue}';

    protected $description = 'Probe infrastruktur health + alert via Telegram jika ada issue (DB/Redis/Queue/Storage)';

    private const DEDUP_TTL_MINUTES = 30;

    private const DEDUP_KEY_PREFIX = 'monitoring:telegram:last-alert:';

    private const HEARTBEAT_KEY = 'monitoring:telegram:last-heartbeat';

    public function handle(TelegramAlertService $telegram): int
    {
        $issues = [];

        // 1. Database
        try {
            $start = microtime(true);
            DB::connection()->getPdo();
            DB::select('SELECT 1');
            $latency = (int) ((microtime(true) - $start) * 1000);
            if ($latency > 1000) {
                $issues['database'] = "high latency: {$latency}ms";
            }
        } catch (\Throwable $e) {
            $issues['database'] = 'unreachable: '.mb_substr($e->getMessage(), 0, 200);
        }

        // 2. Cache
        try {
            $key = 'health_probe:'.time();
            Cache::put($key, 'ok', 60);
            if (Cache::get($key) !== 'ok') {
                $issues['cache'] = 'write/read mismatch';
            }
            Cache::forget($key);
        } catch (\Throwable $e) {
            $issues['cache'] = 'unreachable: '.mb_substr($e->getMessage(), 0, 200);
        }

        // 3. Redis (optional — only if configured)
        if (config('database.redis.default.host')) {
            try {
                $start = microtime(true);
                Redis::ping();
                $latency = (int) ((microtime(true) - $start) * 1000);
                if ($latency > 500) {
                    $issues['redis'] = "high latency: {$latency}ms";
                }
            } catch (\Throwable $e) {
                $issues['redis'] = 'unreachable: '.mb_substr($e->getMessage(), 0, 200);
            }
        }

        // 4. Queue backlog
        try {
            $pending = DB::table('jobs')->count();
            if ($pending > 1000) {
                $issues['queue'] = "backlog: {$pending} pending jobs";
            }
        } catch (\Throwable $e) {
            // table missing = using non-db queue, skip
        }

        // 5. Failed jobs (alert if any exist)
        try {
            $failed = DB::table('failed_jobs')->count();
            if ($failed > 10) {
                $issues['failed_jobs'] = "{$failed} failed jobs in last period";
            }
        } catch (\Throwable $e) {
            // table missing, skip
        }

        // 6. Storage writable
        $storageDir = storage_path('logs');
        if (! is_writable($storageDir)) {
            $issues['storage'] = "logs dir not writable: {$storageDir}";
        }

        // === alerting ===
        if (! empty($issues)) {
            $this->error('Detected '.count($issues).' issue(s):');
            foreach ($issues as $k => $v) {
                $this->error("  - {$k}: {$v}");
            }

            if (! $telegram->isConfigured()) {
                $this->warn('Telegram not configured — alert NOT sent.');

                return self::FAILURE;
            }

            $sent = 0;
            $skipped = 0;
            foreach ($issues as $component => $message) {
                $dedupKey = self::DEDUP_KEY_PREFIX.$component;
                if (! $this->option('force') && Cache::has($dedupKey)) {
                    $skipped++;

                    continue;
                }

                $ok = $telegram->alertHealthIssue(
                    "❗ Health issue: {$component}",
                    ['message' => $message, 'env' => config('app.env')]
                );

                if ($ok) {
                    Cache::put($dedupKey, now()->toIso8601String(), now()->addMinutes(self::DEDUP_TTL_MINUTES));
                    $sent++;
                }
            }

            $this->info("Telegram: sent={$sent}, deduped={$skipped}");

            return self::FAILURE;
        }

        $this->info('All health checks passed.');

        if ($this->option('heartbeat') && $telegram->isConfigured()) {
            // Heartbeat dedup: 1× per 12 jam untuk tidak spam
            if (! Cache::has(self::HEARTBEAT_KEY)) {
                $telegram->send('✅ Heartbeat — all systems healthy', TelegramAlertService::SEVERITY_INFO);
                Cache::put(self::HEARTBEAT_KEY, now()->toIso8601String(), now()->addHours(12));
                $this->info('Heartbeat sent.');
            } else {
                $this->info('Heartbeat skipped (last sent within 12h).');
            }
        }

        return self::SUCCESS;
    }
}
