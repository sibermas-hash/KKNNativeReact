<?php

namespace App\Services\KKN;

use App\Models\KKN\Attendance;
use App\Models\KKN\LocationDispensation;

class AttendanceValidationService
{
    /**
     * Validate attendance based on geofence, timestamp, and other factors
     */
    public function validate(Attendance $attendance): array
    {
        $flags = [];
        $isValid = true;

        // 1. Validate GPS accuracy
        if ($attendance->hasAccuracyIssue()) {
            $flags[] = [
                'type' => 'accuracy_poor',
                'severity' => 'warning',
                'message' => "Akurasi GPS rendah ({$attendance->accuracy_meters}m)",
            ];
        }

        // 2. Validate timestamp
        $timestampValidation = $this->validateTimestamp($attendance);
        if (! $timestampValidation['valid']) {
            $flags[] = $timestampValidation['flag'];
            $isValid = false;
        }

        // 3. Check geofence
        $geofenceValidation = $this->validateGeofence($attendance);
        $attendance->is_within_geofence = $geofenceValidation['within_geofence'];
        $attendance->distance_from_posko = $geofenceValidation['distance'];

        if (! $geofenceValidation['within_geofence']) {
            $flags[] = [
                'type' => 'outside_geofence',
                'severity' => 'warning',
                'message' => "Lokasi {$geofenceValidation['distance']}m di luar area yang diizinkan",
            ];
        }

        // 4. Check for speed anomalies
        if ($attendance->hasSpeedAnomaly()) {
            $flags[] = [
                'type' => 'speed_anomaly',
                'severity' => 'critical',
                'message' => 'Kecepatan terdeteksi tidak mungkin (fraud?)',
            ];
            $isValid = false;
        }

        // 5. Check for duplicate submissions
        $duplicate = $this->checkDuplicate($attendance);
        if ($duplicate) {
            $flags[] = [
                'type' => 'duplicate_submission',
                'severity' => 'critical',
                'message' => 'Submission duplikat terdeteksi',
            ];
            $isValid = false;
        }

        // 6. Check if dispensation applies
        $dispensation = $this->checkDispensation($attendance);
        if ($dispensation) {
            $flags[] = [
                'type' => 'dispensation_active',
                'severity' => 'info',
                'message' => 'Dispensasi aktif untuk hari ini',
            ];
        }

        $attendance->validation_flags = $flags;

        // Set status based on validation
        if (! $isValid) {
            $attendance->status = 'flagged_anomaly';
        } elseif ($dispensation) {
            $attendance->status = 'dispensation_approved';
        } else {
            $attendance->status = 'verified';
        }

        return [
            'valid' => $isValid,
            'flags' => $flags,
            'within_geofence' => $geofenceValidation['within_geofence'],
            'distance' => $geofenceValidation['distance'],
        ];
    }

    /**
     * Validate timestamp for consistency and anomalies
     */
    private function validateTimestamp(Attendance $attendance): array
    {
        $clientTime = $attendance->timestamp_client;
        $serverTime = $attendance->timestamp_server;
        $gpsTime = $attendance->timestamp_gps;

        // Check if server time is significantly different from client time
        $timeDiff = abs($serverTime->diffInSeconds($clientTime));

        // Allow up to 5 minutes difference (offline sync)
        if ($timeDiff > 300) {
            // This is OK for offline sync, not a critical error
            return ['valid' => true, 'flag' => null];
        }

        // If GPS timestamp available, check consistency
        if ($gpsTime) {
            $gpsDiff = abs($clientTime->diffInSeconds($gpsTime));
            if ($gpsDiff > 60) {
                return [
                    'valid' => false,
                    'flag' => [
                        'type' => 'timestamp_mismatch',
                        'severity' => 'warning',
                        'message' => 'Timestamp GPS tidak sesuai dengan waktu capture',
                    ],
                ];
            }
        }

        // Check if timestamp is in the future
        if ($clientTime->isFuture()) {
            return [
                'valid' => false,
                'flag' => [
                    'type' => 'future_timestamp',
                    'severity' => 'critical',
                    'message' => 'Waktu capture lebih maju dari sekarang',
                ],
            ];
        }

        return ['valid' => true, 'flag' => null];
    }

    /**
     * Validate if attendance is within geofence (dynamic based on JenisKkn config)
     */
    private function validateGeofence(Attendance $attendance): array
    {
        if (! $attendance->kelompok) {
            return [
                'within_geofence' => false,
                'distance' => null,
                'skipped' => true,
                'reason' => 'No kelompok assigned',
            ];
        }

        $jenisKkn = $attendance->kelompok->periode?->jenisKkn;
        $config = $jenisKkn?->getAttendanceConfig() ?? [];

        $geofenceEnabled = $config['geofence_enabled'] ?? true;
        $locationSource = $config['location_source'] ?? 'posko';
        $allowedRadius = $config['radius_meters'] ?? 500;

        if (! $geofenceEnabled) {
            return [
                'within_geofence' => true,
                'distance' => null,
                'skipped' => true,
                'reason' => 'Geofencing disabled for this KKN type',
            ];
        }

        if ($locationSource === 'domisili') {
            return $this->validateGeofenceAgainstDomisili($attendance, $allowedRadius);
        }

        return $this->validateGeofenceAgainstPosko($attendance, $allowedRadius);
    }

    /**
     * Validate against kelompok posko location
     */
    private function validateGeofenceAgainstPosko(Attendance $attendance, int $allowedRadius): array
    {
        if (! $attendance->kelompok->posko) {
            return [
                'within_geofence' => false,
                'distance' => null,
                'reason' => 'No posko defined for kelompok',
            ];
        }

        $posko = $attendance->kelompok->posko;
        $distance = $attendance->calculateDistanceFromPosko();

        return [
            'within_geofence' => $distance !== null && $distance <= $allowedRadius,
            'distance' => $distance,
            'location_type' => 'posko',
        ];
    }

    /**
     * Validate against student's registered domisili location (for KKN Mandiri)
     */
    private function validateGeofenceAgainstDomisili(Attendance $attendance, int $allowedRadius): array
    {
        if (! $attendance->peserta?->mahasiswa?->domisili_lat || ! $attendance->peserta?->mahasiswa?->domisili_lng) {
            return [
                'within_geofence' => false,
                'distance' => null,
                'reason' => 'No domisili location registered',
            ];
        }

        $domisiliLat = $attendance->peserta->mahasiswa->domisili_lat;
        $domisiliLng = $attendance->peserta->mahasiswa->domisili_lng;
        $attendanceLat = $attendance->latitude;
        $attendanceLng = $attendance->longitude;

        if ($attendanceLat === null || $attendanceLng === null) {
            return [
                'within_geofence' => false,
                'distance' => null,
                'reason' => 'No GPS coordinates in attendance',
            ];
        }

        $distance = $this->calculateHaversineDistance(
            $attendanceLat,
            $attendanceLng,
            $domisiliLat,
            $domisiliLng
        );

        return [
            'within_geofence' => $distance <= $allowedRadius,
            'distance' => $distance,
            'location_type' => 'domisili',
        ];
    }

    /**
     * Calculate distance using Haversine formula
     */
    private function calculateHaversineDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371000;

        $lat1Rad = deg2rad($lat1);
        $lat2Rad = deg2rad($lat2);
        $deltaLat = deg2rad($lat2 - $lat1);
        $deltaLng = deg2rad($lng2 - $lng1);

        $a = sin($deltaLat / 2) * sin($deltaLat / 2) +
            cos($lat1Rad) * cos($lat2Rad) *
            sin($deltaLng / 2) * sin($deltaLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Check for duplicate submissions
     */
    private function checkDuplicate(Attendance $attendance): bool
    {
        $timeDiff = 60; // Same activity within 60 seconds = duplicate

        return Attendance::where('user_id', $attendance->user_id)
            ->where('activity_type', $attendance->activity_type)
            ->where('periode_id', $attendance->periode_id)
            ->where('timestamp_client', '>=', $attendance->timestamp_client->subSeconds($timeDiff))
            ->where('timestamp_client', '<', $attendance->timestamp_client)
            ->exists();
    }

    /**
     * Check if dispensation is active for this user on this date
     */
    private function checkDispensation(Attendance $attendance): ?LocationDispensation
    {
        return LocationDispensation::where('user_id', $attendance->user_id)
            ->where('periode_id', $attendance->periode_id)
            ->where('dispensation_date', $attendance->timestamp_client->toDateString())
            ->active()
            ->first();
    }

    /**
     * Get validation message for frontend
     */
    public function getValidationMessage(Attendance $attendance): string
    {
        if ($attendance->status === 'verified') {
            return '✅ Absensi berhasil diverifikasi';
        }

        if ($attendance->status === 'dispensation_approved') {
            return '✅ Dispensasi aktif, absensi tercatat';
        }

        if ($attendance->status === 'flagged_anomaly') {
            $flags = $attendance->getValidationFlags();
            $critical = collect($flags)
                ->filter(fn ($f) => $f['severity'] === 'critical')
                ->first();

            return $critical['message'] ?? '⚠️ Absensi memerlukan verifikasi manual';
        }

        return '⏳ Menunggu verifikasi';
    }
}
