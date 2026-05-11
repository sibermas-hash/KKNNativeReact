<?php

declare(strict_types=1);

namespace App\Services\KKN;

use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\SystemSetting;
use Carbon\Carbon;

/**
 * GpsAntiSpoofService — deteksi GPS spoofing pada laporan harian KKN.
 *
 * Cek yang dilakukan:
 *   1. is_mock_location — flag dari mobile (Android Location.isFromMockProvider)
 *   2. Zero/impossible accuracy — banyak fake GPS pakai accuracy=0 atau <1m
 *   3. Perfect-rounded coords — lat/lng rounded ke 4+ decimal zeros (hardcoded)
 *   4. Duplicate coordinate pattern — exact same lat/lng dengan report sebelumnya
 *      (indikasi hardcoded location)
 *   5. Teleportation check — kalau last report <2 jam lalu, cek apakah jarak
 *      yang ditempuh realistis (max 60 km/jam sepeda motor/mobil pelan)
 *
 * Output:
 *   - action: 'allow' | 'flag' | 'reject'
 *   - suspicions: array<string> — alasan-alasan yang terdeteksi
 *   - score: 0-100 (risk score — tinggi = makin mencurigakan)
 *
 * Decision matrix:
 *   - score >= 70 OR is_mock_location=true → REJECT (hard block, throw validation)
 *   - score 40-69 → FLAG (allow submit tapi set review_notes + flag untuk DPL)
 *   - score < 40 → ALLOW (lolos)
 *
 * Superadmin bypass semua cek (sama seperti geofence policy existing).
 */
class GpsAntiSpoofService
{
    public const ACTION_ALLOW = 'allow';
    public const ACTION_FLAG = 'flag';
    public const ACTION_REJECT = 'reject';

    /**
     * @param  array{latitude: float, longitude: float, gps_accuracy?: float|null, captured_at?: string|null, is_mock_location?: bool|null}  $input
     * @return array{action: string, score: int, suspicions: array<int, array{code: string, message: string, severity: int}>, metadata: array<string, mixed>}
     */
    public function analyze(array $input, int $mahasiswaId): array
    {
        $suspicions = [];
        $score = 0;

        $lat = (float) $input['latitude'];
        $lng = (float) $input['longitude'];
        $accuracy = isset($input['gps_accuracy']) ? (float) $input['gps_accuracy'] : null;
        $capturedAt = isset($input['captured_at']) ? Carbon::parse($input['captured_at']) : now();
        $isMock = (bool) ($input['is_mock_location'] ?? false);

        // 1. Mock location explicit flag (from mobile Location.isFromMockProvider API)
        if ($isMock) {
            $suspicions[] = [
                'code' => 'mock_location_flag',
                'message' => 'Device melaporkan lokasi dari mock provider (developer option aktif atau fake GPS app).',
                'severity' => 90,
            ];
            $score = max($score, 90);
        }

        // 2. Zero/near-zero accuracy (real GPS rarely < 3m outdoor)
        if ($accuracy !== null) {
            if ($accuracy === 0.0) {
                $suspicions[] = [
                    'code' => 'zero_accuracy',
                    'message' => 'GPS accuracy = 0m (secara fisik tidak mungkin, indikasi fake GPS).',
                    'severity' => 60,
                ];
                $score = max($score, 60);
            } elseif ($accuracy < 1.0 && $accuracy > 0) {
                $suspicions[] = [
                    'code' => 'implausible_accuracy',
                    'message' => sprintf('GPS accuracy %.2fm terlalu tinggi untuk device mobile.', $accuracy),
                    'severity' => 40,
                ];
                $score = max($score, 40);
            }
        }

        // 3. Perfect rounded coordinates (e.g. -7.5000000, 109.2000000)
        //    Real GPS jarang mengembalikan koordinat dengan 4+ decimal = 0
        if ($this->hasPerfectRounding($lat) && $this->hasPerfectRounding($lng)) {
            $suspicions[] = [
                'code' => 'rounded_coords',
                'message' => 'Koordinat terlalu bulat — lat/lng dibulatkan ke 4+ decimal zero (kemungkinan hardcoded).',
                'severity' => 50,
            ];
            $score = max($score, 50);
        }

        // 4. Duplicate exact coordinates with recent reports (same student)
        $lastReport = KegiatanKkn::where('mahasiswa_id', $mahasiswaId)
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->orderByDesc('created_at')
            ->first();

        if ($lastReport) {
            $lastLat = (float) $lastReport->latitude;
            $lastLng = (float) $lastReport->longitude;

            // Exact match (to 6 decimals = ~11 cm) is very suspicious
            if (abs($lat - $lastLat) < 1e-6 && abs($lng - $lastLng) < 1e-6) {
                $suspicions[] = [
                    'code' => 'identical_coords',
                    'message' => 'Koordinat identik (±11 cm) dengan laporan terakhir — indikasi hardcoded location.',
                    'severity' => 45,
                ];
                $score = max($score, 45);
            }

            // 5. Teleportation check: if last report <2 hours ago, realistic speed < 60 km/h
            $hoursSinceLast = $lastReport->created_at->diffInSeconds($capturedAt) / 3600;
            if ($hoursSinceLast > 0 && $hoursSinceLast < 2) {
                $distanceKm = $this->haversineKm($lat, $lng, $lastLat, $lastLng);
                $speedKmh = $distanceKm / max($hoursSinceLast, 0.016); // floor to 1min

                if ($speedKmh > 120) {
                    $suspicions[] = [
                        'code' => 'teleportation',
                        'message' => sprintf(
                            'Kecepatan berpindah %s km/jam dari laporan sebelumnya (jarak %s km dalam %s menit).',
                            round($speedKmh),
                            round($distanceKm, 1),
                            round($hoursSinceLast * 60)
                        ),
                        'severity' => 80,
                    ];
                    $score = max($score, 80);
                } elseif ($speedKmh > 60) {
                    $suspicions[] = [
                        'code' => 'fast_travel',
                        'message' => sprintf('Perpindahan %s km/jam (cepat tapi mungkin via kendaraan).', round($speedKmh)),
                        'severity' => 25,
                    ];
                    $score = max($score, 25);
                }
            }
        }

        // Decision
        // Audit R11-FULL-018 fix: guardrail untuk SystemSetting misconfig.
        // Kalau admin set reject=0 atau flag>reject (inverted), seluruh
        // submission akan di-reject. Clamp ke range sehat dan pastikan
        // flag <= reject. Default: reject=70, flag=40.
        $rejectRaw = (int) SystemSetting::get('gps_antispoof_reject_score', '70');
        $flagRaw = (int) SystemSetting::get('gps_antispoof_flag_score', '40');
        $hardRejectThreshold = max(1, min(100, $rejectRaw)); // 1..100
        $flagThreshold = max(0, min($hardRejectThreshold - 1, $flagRaw)); // 0..reject-1

        $action = match (true) {
            $score >= $hardRejectThreshold => self::ACTION_REJECT,
            $score >= $flagThreshold => self::ACTION_FLAG,
            default => self::ACTION_ALLOW,
        };

        return [
            'action' => $action,
            'score' => $score,
            'suspicions' => $suspicions,
            'metadata' => [
                'analyzed_at' => now()->toIso8601String(),
                'thresholds' => [
                    'reject' => $hardRejectThreshold,
                    'flag' => $flagThreshold,
                ],
                'input' => [
                    'lat' => $lat,
                    'lng' => $lng,
                    'accuracy' => $accuracy,
                    'is_mock' => $isMock,
                ],
            ],
        ];
    }

    /**
     * Check if coordinate has suspicious rounding (≥4 decimals are zero).
     * Real GPS has precision ~6 decimals. Rounded to 4 decimals = ~11m precision max.
     */
    private function hasPerfectRounding(float $value): bool
    {
        $str = number_format($value, 7, '.', '');
        // Strip trailing zeros after decimal
        $decimals = substr($str, strpos($str, '.') + 1);

        // Count trailing zeros
        $trailingZeros = 0;
        for ($i = strlen($decimals) - 1; $i >= 0; $i--) {
            if ($decimals[$i] !== '0') {
                break;
            }
            $trailingZeros++;
        }

        // 4+ trailing zeros = suspicious (e.g. X.YZ10000 = precision 2 decimals)
        return $trailingZeros >= 4;
    }

    /**
     * Haversine great-circle distance in kilometers.
     */
    private function haversineKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadiusKm = 6371.0;

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadiusKm * $c;
    }
}
