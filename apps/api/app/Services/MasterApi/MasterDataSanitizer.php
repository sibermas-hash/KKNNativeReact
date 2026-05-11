<?php

declare(strict_types=1);

namespace App\Services\MasterApi;

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
 */
class MasterDataSanitizer
{
    /**
     * Clamp GPA to [0, 4.0]. Logs a warning when clamping so ops can
     * investigate with SIAKAD (we preserve the clamp, not the raw value —
     * the raw corrupt value has no legitimate use downstream).
     */
    public static function gpa(mixed $raw, string $id): float
    {
        if ($raw === null || $raw === '') {
            return 0.0;
        }

        $value = (float) $raw;

        if ($value < 0 || $value > 4.01) {
            Log::warning('SIAKAD GPA out of range — clamped to [0, 4.0]', [
                'id' => $id,
                'raw_gpa' => $raw,
                'clamped_to' => max(0.0, min(4.0, $value)),
            ]);
            return max(0.0, min(4.0, $value));
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
        if ($raw === null) {
            return null;
        }

        $value = trim((string) $raw);
        if ($value === '') {
            return null;
        }

        if (! preg_match('/^\d{16}$/', $value)) {
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
        $currentYear = (int) date('Y');

        if ($year < $minYear) {
            Log::info('SIAKAD batch_year older than expected range', [
                'id' => $id,
                'batch_year' => $year,
                'min_accepted' => $minYear,
            ]);
        }

        return $year;
    }
}
