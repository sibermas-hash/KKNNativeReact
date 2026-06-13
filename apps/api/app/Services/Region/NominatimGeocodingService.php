<?php

declare(strict_types=1);

namespace App\Services\Region;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NominatimGeocodingService
{
    /** @return array{latitude: float, longitude: float, display_name: string, provider: string}|null */
    public function search(string $query): ?array
    {
        $response = Http::withHeaders([
            'User-Agent' => config('app.name', 'SIBERMAS').'/1.0 (KKN location geocoding)',
            'Accept' => 'application/json',
        ])->timeout(20)->retry(2, 1000)->get('https://nominatim.openstreetmap.org/search', [
            'q' => $query,
            'format' => 'jsonv2',
            'limit' => 1,
            'countrycodes' => 'id',
            'addressdetails' => 1,
        ]);

        if (! $response->successful()) {
            Log::warning('Nominatim geocoding failed', ['query' => $query, 'status' => $response->status()]);

            return null;
        }

        $first = collect($response->json())->first();
        if (! is_array($first) || empty($first['lat']) || empty($first['lon'])) {
            return null;
        }

        return [
            'latitude' => (float) $first['lat'],
            'longitude' => (float) $first['lon'],
            'display_name' => (string) ($first['display_name'] ?? $query),
            'provider' => 'openstreetmap:nominatim',
        ];
    }
}
