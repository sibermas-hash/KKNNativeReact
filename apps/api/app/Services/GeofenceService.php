<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\Lokasi;

class GeofenceService
{
    private const EARTH_RADIUS_METERS = 6371000;

    private const DEFAULT_RADIUS_METERS = 750;

    private const RADIUS_BY_ACCURACY = [
        20 => 500,
        50 => 750,
        100 => 1000,
        300 => 1500,
    ];

    public function validateLocation(
        float $lat,
        float $lng,
        float $accuracy,
        Lokasi $village
    ): ValidationResult {
        $distance = $this->calculateDistanceMeters(
            $lat, $lng,
            $village->latitude, $village->longitude
        );

        $baseRadius = $village->geofence_radius_meters ?? self::DEFAULT_RADIUS_METERS;
        $accuracyBuffer = min($accuracy * 1.5, 300);
        $effectiveRadius = $baseRadius + $accuracyBuffer;

        return new ValidationResult(
            is_valid: $distance <= $effectiveRadius,
            distance_meters: $distance,
            effective_radius: $effectiveRadius,
            accuracy_used: $accuracy,
        );
    }

    public function calculateDistanceMeters(
        float $lat1,
        float $lng1,
        float $lat2,
        float $lng2
    ): float {
        $phi1 = deg2rad($lat1);
        $phi2 = deg2rad($lat2);
        $dPhi = deg2rad($lat2 - $lat1);
        $dLam = deg2rad($lng2 - $lng1);

        $a = sin($dPhi / 2) ** 2
            + cos($phi1) * cos($phi2) * sin($dLam / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return self::EARTH_RADIUS_METERS * $c;
    }

    public function getAdaptiveRadius(float $accuracy): int
    {
        foreach (self::RADIUS_BY_ACCURACY as $maxAccuracy => $radius) {
            if ($accuracy <= $maxAccuracy) {
                return $radius;
            }
        }

        return (int) ($accuracy * 3);
    }

    public function isWithinRadius(
        float $userLat,
        float $userLng,
        float $targetLat,
        float $targetLng,
        int $radiusMeters
    ): bool {
        $distance = $this->calculateDistanceMeters(
            $userLat, $userLng,
            $targetLat, $targetLng
        );

        return $distance <= $radiusMeters;
    }
}

class ValidationResult
{
    public function __construct(
        public readonly bool $is_valid,
        public readonly float $distance_meters,
        public readonly int $effective_radius,
        public readonly float $accuracy_used,
    ) {}
}
