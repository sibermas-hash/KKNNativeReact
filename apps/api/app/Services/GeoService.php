<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Geographic utility service for distance calculations.
 * Uses the Haversine formula to calculate great-circle distance between two points.
 */
class GeoService
{
    /**
     * Earth's mean radius in meters.
     */
    private const EARTH_RADIUS_METERS = 6371000;

    /**
     * Calculate the distance in meters between two GPS coordinates using the Haversine formula.
     *
     * @param  float  $latitude  Latitude of point 1
     * @param  float  $longitude  Longitude of point 1
     * @param  float  $referenceLatitude  Latitude of point 2
     * @param  float  $referenceLongitude  Longitude of point 2
     * @return float Distance in meters
     */
    public function calculateDistanceMeters(
        float $latitude,
        float $longitude,
        float $referenceLatitude,
        float $referenceLongitude
    ): float {
        $latitudeDelta = deg2rad($referenceLatitude - $latitude);
        $longitudeDelta = deg2rad($referenceLongitude - $longitude);

        $a = sin($latitudeDelta / 2) ** 2
            + cos(deg2rad($latitude)) * cos(deg2rad($referenceLatitude)) * sin($longitudeDelta / 2) ** 2;

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return self::EARTH_RADIUS_METERS * $c;
    }
}
