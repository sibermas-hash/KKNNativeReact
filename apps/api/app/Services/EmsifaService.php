<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class EmsifaService
{
    private const BASE_URL = 'https://www.emsifa.com/api-wilayah-indonesia/api';

    /**
     * Attempts to automatically find the BPS code based on region names.
     */
    public function findVillageCode(string $regencyName, string $districtName, string $villageName): ?string
    {
        // 1. Find Regency ID
        $regencyId = $this->findRegencyId($regencyName);
        if (! $regencyId) {
            return null;
        }

        // 2. Find District ID
        $districtId = $this->findDistrictId($regencyId, $districtName);
        if (! $districtId) {
            return null;
        }

        // 3. Find Village ID
        return $this->findVillageId($districtId, $villageName);
    }

    private function findRegencyId(string $regencyName): ?string
    {
        $allRegencies = Cache::remember('emsifa_all_regencies_v2', 86400 * 30, function () {
            $response = Http::timeout(10)->get(self::BASE_URL.'/provinces.json');

            if (! $response->ok()) {
                return [];
            }

            $provinces = $response->json();
            if (! is_array($provinces)) {
                return [];
            }

            // Fetch all regencies in parallel to prevent massive delays
            $responses = Http::pool(function (Pool $pool) use ($provinces) {
                foreach ($provinces as $province) {
                    $pool->as((string) $province['id'])->timeout(10)->get(self::BASE_URL.'/regencies/'.$province['id'].'.json');
                }
            });

            $regencies = [];
            foreach ($responses as $res) {
                if ($res instanceof Response && $res->ok()) {
                    $data = $res->json();
                    if (is_array($data)) {
                        $regencies = array_merge($regencies, $data);
                    }
                }
            }

            return $regencies;
        });

        $search = Str::slug($regencyName);

        // Exact match
        foreach ($allRegencies as $reg) {
            if (Str::slug($reg['name']) === $search) {
                return $reg['id'];
            }
        }

        // Partial match (e.g., "Banyumas" matching "Kabupaten Banyumas")
        foreach ($allRegencies as $reg) {
            if (Str::contains(Str::slug($reg['name']), $search)) {
                return $reg['id'];
            }
        }

        return null;
    }

    private function findDistrictId(string $regencyId, string $districtName): ?string
    {
        $districts = Cache::remember('emsifa_districts_'.$regencyId, 86400 * 30, function () use ($regencyId) {
            $res = Http::timeout(10)->get(self::BASE_URL.'/districts/'.$regencyId.'.json');

            return $res->ok() ? $res->json() : [];
        });

        if (! is_array($districts)) {
            return null;
        }

        $search = Str::slug($districtName);
        foreach ($districts as $dist) {
            if (Str::slug($dist['name']) === $search) {
                return $dist['id'];
            }
        }

        return null;
    }

    private function findVillageId(string $districtId, string $villageName): ?string
    {
        $villages = Cache::remember('emsifa_villages_'.$districtId, 86400 * 30, function () use ($districtId) {
            $res = Http::timeout(10)->get(self::BASE_URL.'/villages/'.$districtId.'.json');

            return $res->ok() ? $res->json() : [];
        });

        if (! is_array($villages)) {
            return null;
        }

        $search = Str::slug($villageName);
        foreach ($villages as $vill) {
            if (Str::slug($vill['name']) === $search) {
                return $vill['id'];
            }
        }

        return null;
    }
}
