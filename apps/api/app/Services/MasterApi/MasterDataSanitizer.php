<?php

declare(strict_types=1);

namespace App\Services\MasterApi;

use App\Services\TelegramAlertService;
use Illuminate\Support\Facades\Log;

/**
 * SIAKAD data sanitizer.
 *
 * Consolidates per-field cleanup that both `SyncMasterData` (artisan CLI)
 * and `StudentSyncService` (webhook + HTTP admin sync) need to apply,
 * so the rules stay in sync across entry points.
 *
 * Findings this was built to address (live monitoring on 2026-05-09):
 *   - 269 mahasiswa with GPA > 4.0 from SIAKAD (corrupt data, e.g. 11.05)
 *   - 40 mahasiswa with malformed NIK (length != 16 including empty string)
 *
 * ---------------------------------------------------------------------
 * Stats tracking (added 2026-05-12 per ops feedback)
 * ---------------------------------------------------------------------
 * The class keeps aggregated counters for a single sync run. Callers
 * (SyncMasterData, StudentSyncService) reset stats at the start of a
 * run with `resetStats()` and fetch the summary at the end with
 * `getStats()`. If the clamp ratio exceeds `ALERT_THRESHOLD_RATIO`
 * (default 1% of processed rows), `maybeAlertOps()` fires a single
 * Telegram message so data-quality issues with SIAKAD surface early
 * without drowning ops in per-row alerts.
 */
class MasterDataSanitizer
{
    /**
     * Fire an ops alert when >= this fraction of rows had to be clamped.
     * 0.01 = 1% of processed rows had corrupt GPA.
     */
    private const ALERT_THRESHOLD_RATIO = 0.01;

    /**
     * Minimum sample size before the threshold is meaningful. If we only
     * processed 3 rows and 1 was clamped, that's noise, not a signal.
     */
    private const ALERT_MIN_SAMPLE = 50;

    /**
     * @var array{gpa_processed:int, gpa_clamped:int, gpa_samples:array<int, array{id:string, raw:mixed}>, nik_processed:int, nik_invalid:int}
     */
    private static array $stats = [
        'gpa_processed' => 0,
        'gpa_clamped' => 0,
        'gpa_samples' => [],
        'nik_processed' => 0,
        'nik_invalid' => 0,
    ];

    /**
     * Reset the per-run counters. Call at the start of a sync command.
     */
    public static function resetStats(): void
    {
        self::$stats = [
            'gpa_processed' => 0,
            'gpa_clamped' => 0,
            'gpa_samples' => [],
            'nik_processed' => 0,
            'nik_invalid' => 0,
        ];
    }

    /**
     * Return the collected counters so the caller can log them in SyncLog.
     *
     * @return array{gpa_processed:int, gpa_clamped:int, gpa_samples:array<int, array{id:string, raw:mixed}>, nik_processed:int, nik_invalid:int, gpa_clamp_ratio:float}
     */
    public static function getStats(): array
    {
        $stats = self::$stats;
        $stats['gpa_clamp_ratio'] = $stats['gpa_processed'] > 0
            ? round($stats['gpa_clamped'] / $stats['gpa_processed'], 4)
            : 0.0;

        return $stats;
    }

    /**
     * Clamp GPA to [0, 4.0]. Logs a warning when clamping so ops can
     * investigate with SIAKAD (we preserve the clamp, not the raw value —
     * the raw corrupt value has no legitimate use downstream).
     */
    public static function gpa(mixed $raw, string $id): float
    {
        self::$stats['gpa_processed']++;

        if ($raw === null || $raw === '') {
            return 0.0;
        }

        $value = (float) $raw;

        if ($value < 0 || $value > 4.0) {
            $clamped = max(0.0, min(4.0, $value));
            self::$stats['gpa_clamped']++;
            // keep at most 10 samples for ops to inspect, to cap memory
            if (count(self::$stats['gpa_samples']) < 10) {
                self::$stats['gpa_samples'][] = ['id' => $id, 'raw' => $raw];
            }

            Log::warning('SIAKAD GPA out of range — clamped to [0, 4.0]', [
                'id' => $id,
                'raw_gpa' => $raw,
                'clamped_to' => $clamped,
            ]);

            return $clamped;
        }

        return $value;
    }

    /**
     * Normalize Indonesian NIK: must be exactly 16 digits, else NULL.
     * Empty string is a common SIAKAD artifact and MUST become NULL so
     * eligibility checks treat it as "NIK missing".
     */
    public static function nik(mixed $raw, string $id): ?string
    {
        self::$stats['nik_processed']++;

        if ($raw === null) {
            return null;
        }

        $value = trim((string) $raw);
        if ($value === '') {
            self::$stats['nik_invalid']++;

            return null;
        }

        if (! preg_match('/^\d{16}$/', $value)) {
            self::$stats['nik_invalid']++;
            Log::info('SIAKAD NIK malformed — stored as NULL', [
                'id' => $id,
                'raw_len' => strlen($value),
                'raw_prefix' => substr($value, 0, 4).'…',
            ]);

            return null;
        }

        return $value;
    }

    /**
     * Normalize batch year: flag implausibly old or future years so admin
     * notices (e.g., ghost alumni still in SIAKAD with batch_year=2014).
     * Returns the raw year unchanged; caller decides whether to exclude.
     */
    public static function batchYear(mixed $raw, string $id, int $minYear = 2015): ?int
    {
        if ($raw === null || $raw === '') {
            return null;
        }

        $year = (int) $raw;

        if ($year < $minYear) {
            Log::info('SIAKAD batch_year older than expected range', [
                'id' => $id,
                'batch_year' => $year,
                'min_accepted' => $minYear,
            ]);
        }

        return $year;
    }

    /**
     * Emit a Telegram alert if the GPA clamp ratio is high enough that
     * ops should coordinate with SIAKAD IT. Called at the end of a sync
     * run. Silent no-op when Telegram is not configured or the threshold
     * is not reached.
     */
    public static function maybeAlertOps(string $context = 'sync:master-data'): bool
    {
        $stats = self::getStats();
        $clampRatio = $stats['gpa_clamp_ratio'];
        $processed = $stats['gpa_processed'];

        if ($processed < self::ALERT_MIN_SAMPLE || $clampRatio < self::ALERT_THRESHOLD_RATIO) {
            return false;
        }

        try {
            /** @var TelegramAlertService $telegram */
            $telegram = app(TelegramAlertService::class);
            if (! $telegram->isConfigured()) {
                return false;
            }

            $samples = array_map(
                static fn (array $s) => "  - `{$s['id']}` → `{$s['raw']}`",
                array_slice($stats['gpa_samples'], 0, 5)
            );

            $message = [
                "*Data anomaly terdeteksi pada {$context}*",
                '',
                'Rasio GPA out-of-range: *'.number_format($clampRatio * 100, 2)."%* ({$stats['gpa_clamped']}/{$processed}).",
                '',
                'Sample record (NIM → IPK mentah):',
                ...$samples,
                '',
                'Semua nilai sudah di-clamp ke [0, 4.0] di lokal. Mohon koordinasi dengan Admin SIAKAD untuk memperbaiki data sumber agar statistik KKN akurat.',
            ];

            return $telegram->send(
                implode("\n", $message),
                TelegramAlertService::SEVERITY_WARNING
            );
        } catch (\Throwable $e) {
            Log::warning('MasterDataSanitizer ops alert failed', ['error' => $e->getMessage()]);

            return false;
        }
    }
}
