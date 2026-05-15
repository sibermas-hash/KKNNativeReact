<?php

namespace App\Services\KKN;

use App\Models\KKN\Attendance;

class FraudDetectionService
{
    /**
     * Analyze attendance for fraud indicators
     */
    public function analyze(Attendance $attendance): array
    {
        $indicators = [];
        $riskScore = 0; // 0-100

        // 1. Check velocity (impossible travel)
        $velocityCheck = $this->checkVelocity($attendance);
        if ($velocityCheck['risk'] > 0) {
            $indicators[] = $velocityCheck['indicator'];
            $riskScore += $velocityCheck['risk'];
        }

        // 2. Check GPS consistency
        $gpsCheck = $this->checkGpsConsistency($attendance);
        if ($gpsCheck['risk'] > 0) {
            $indicators[] = $gpsCheck['indicator'];
            $riskScore += $gpsCheck['risk'];
        }

        // 3. Check for spoofing patterns
        $spoofingCheck = $this->checkSpoofing($attendance);
        if ($spoofingCheck['risk'] > 0) {
            $indicators[] = $spoofingCheck['indicator'];
            $riskScore += $spoofingCheck['risk'];
        }

        // 4. Check device patterns
        $deviceCheck = $this->checkDevicePatterns($attendance);
        if ($deviceCheck['risk'] > 0) {
            $indicators[] = $deviceCheck['indicator'];
            $riskScore += $deviceCheck['risk'];
        }

        // 5. Behavioral analysis
        $behavioralCheck = $this->checkBehavioralPatterns($attendance);
        if ($behavioralCheck['risk'] > 0) {
            $indicators[] = $behavioralCheck['indicator'];
            $riskScore += $behavioralCheck['risk'];
        }

        // Cap risk score at 100
        $riskScore = min($riskScore, 100);

        // Determine risk level
        $riskLevel = match (true) {
            $riskScore >= 80 => 'critical',
            $riskScore >= 60 => 'high',
            $riskScore >= 40 => 'medium',
            $riskScore >= 20 => 'low',
            default => 'minimal',
        };

        return [
            'risk_score' => $riskScore,
            'risk_level' => $riskLevel,
            'indicators' => $indicators,
            'requires_manual_review' => $riskScore >= 60,
        ];
    }

    /**
     * Check for impossible travel (velocity anomaly)
     */
    private function checkVelocity(Attendance $attendance): array
    {
        // Get previous attendance within last 2 hours
        $previousAttendance = Attendance::where('user_id', $attendance->user_id)
            ->where('id', '!=', $attendance->id)
            ->where('timestamp_client', '>=', $attendance->timestamp_client->subHours(2))
            ->where('timestamp_client', '<', $attendance->timestamp_client)
            ->orderByDesc('timestamp_client')
            ->first();

        if (! $previousAttendance) {
            return ['risk' => 0, 'indicator' => null];
        }

        // Calculate distance and time
        $distance = $this->haversineDistance(
            $previousAttendance->latitude,
            $previousAttendance->longitude,
            $attendance->latitude,
            $attendance->longitude
        );

        $timeDiff = $attendance->timestamp_client->diffInSeconds($previousAttendance->timestamp_client);

        // A-08 fix: guard against division by zero (2 submits in same second)
        if ($timeDiff <= 0) {
            return [
                'risk' => 35,
                'indicator' => [
                    'type' => 'zero_time_diff',
                    'severity' => 'high',
                    'message' => 'Dua absensi dalam waktu bersamaan — kemungkinan submit otomatis',
                ],
            ];
        }

        $requiredSpeed = $distance / $timeDiff; // m/s

        // Max reasonable speed: 50 m/s (180 km/h - highway speed)
        // GPS spoofing typically shows instant jumps
        if ($requiredSpeed > 50) {
            return [
                'risk' => 35,
                'indicator' => [
                    'type' => 'impossible_velocity',
                    'severity' => 'high',
                    'message' => "Kecepatan tidak mungkin: {$requiredSpeed}m/s ({$distance}m dalam {$timeDiff}s)",
                    'details' => [
                        'required_speed_mps' => round($requiredSpeed, 2),
                        'distance_meters' => round($distance, 2),
                        'time_seconds' => $timeDiff,
                    ],
                ],
            ];
        }

        return ['risk' => 0, 'indicator' => null];
    }

    /**
     * Check GPS accuracy consistency
     */
    private function checkGpsConsistency(Attendance $attendance): array
    {
        // Poor accuracy + outside geofence + poor signal = suspicious
        if (
            $attendance->accuracy_meters > 100 &&
            ! $attendance->is_within_geofence &&
            $attendance->speed_mps === null // No velocity data
        ) {
            return [
                'risk' => 25,
                'indicator' => [
                    'type' => 'poor_gps_consistency',
                    'severity' => 'medium',
                    'message' => 'Akurasi GPS rendah, lokasi di luar area, tidak ada data kecepatan',
                ],
            ];
        }

        return ['risk' => 0, 'indicator' => null];
    }

    /**
     * Check for GPS spoofing patterns
     */
    private function checkSpoofing(Attendance $attendance): array
    {
        // Pattern indicators:
        // 1. Exact location repeats
        // 2. Round number coordinates
        // 3. Zero accuracy claims
        // 4. Instant position jumps

        // Check for repeated exact coordinates
        $sameLocation = Attendance::where('user_id', $attendance->user_id)
            ->where('latitude', $attendance->latitude)
            ->where('longitude', $attendance->longitude)
            ->where('id', '!=', $attendance->id)
            ->where('created_at', '>=', now()->subDays(7))
            ->count();

        if ($sameLocation > 3) {
            return [
                'risk' => 20,
                'indicator' => [
                    'type' => 'repeated_exact_location',
                    'severity' => 'medium',
                    'message' => "Lokasi yang sama direkam {$sameLocation}x dalam 7 hari terakhir",
                ],
            ];
        }

        // Check for round number coordinates (suspicious spoofing)
        $hasRoundCoords = (
            ($attendance->latitude * 1000) % 100 === 0 ||
            ($attendance->longitude * 1000) % 100 === 0
        );

        if ($hasRoundCoords && $attendance->accuracy_meters < 10) {
            return [
                'risk' => 15,
                'indicator' => [
                    'type' => 'round_number_coordinates',
                    'severity' => 'low',
                    'message' => 'Koordinat berupa angka bulat (mungkin fake GPS)',
                ],
            ];
        }

        return ['risk' => 0, 'indicator' => null];
    }

    /**
     * Check device patterns
     */
    private function checkDevicePatterns(Attendance $attendance): array
    {
        // Check if multiple users from same device
        if ($attendance->device_signature) {
            $otherUsers = Attendance::where('device_signature', $attendance->device_signature)
                ->where('user_id', '!=', $attendance->user_id)
                ->where('created_at', '>=', now()->subDays(30))
                ->distinct('user_id')
                ->count('user_id');

            if ($otherUsers > 1) {
                return [
                    'risk' => 30,
                    'indicator' => [
                        'type' => 'shared_device_signature',
                        'severity' => 'high',
                        'message' => "Perangkat yang sama digunakan {$otherUsers} pengguna berbeda",
                    ],
                ];
            }
        }

        return ['risk' => 0, 'indicator' => null];
    }

    /**
     * Check behavioral patterns
     */
    private function checkBehavioralPatterns(Attendance $attendance): array
    {
        // Check for unusual timing patterns
        $userAttendances = Attendance::where('user_id', $attendance->user_id)
            ->where('periode_id', $attendance->periode_id)
            ->where('activity_type', $attendance->activity_type)
            ->orderByDesc('timestamp_client')
            ->limit(10)
            ->get();

        if ($userAttendances->count() > 0) {
            // Check if time of day is unusual
            $avgHour = $userAttendances->avg(function ($a) {
                return $a->timestamp_client->hour;
            });

            $currentHour = $attendance->timestamp_client->hour;
            $hourDiff = abs($currentHour - $avgHour);

            // If diff > 6 hours from usual, it's suspicious
            if ($hourDiff > 6) {
                return [
                    'risk' => 15,
                    'indicator' => [
                        'type' => 'unusual_timing',
                        'severity' => 'low',
                        'message' => "Waktu absensi {$currentHour}:00 berbeda dari biasanya ({$avgHour}:00)",
                    ],
                ];
            }
        }

        return ['risk' => 0, 'indicator' => null];
    }

    /**
     * Haversine distance formula (duplicate from Attendance model for service use)
     */
    private function haversineDistance($lat1, $lon1, $lat2, $lon2): float
    {
        $earthRadius = 6371000; // meters

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
