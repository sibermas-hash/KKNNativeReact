<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Region\IndonesiaDistrict;
use App\Models\Region\IndonesiaProvince;
use App\Models\Region\IndonesiaRegency;
use App\Models\Region\IndonesiaVillage;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class SyncIndonesiaRegions extends Command
{
    protected $signature = 'regions:sync-indonesia {--fresh : Truncate region tables first}';

    protected $description = 'Sync Indonesia administrative regions from cahyadsn/wilayah 2025 public dataset.';

    private string $sqlUrl = 'https://raw.githubusercontent.com/cahyadsn/wilayah/master/db/wilayah.sql';

    public function handle(): int
    {
        ini_set('memory_limit', '512M');

        if ($this->option('fresh')) {
            IndonesiaVillage::query()->delete();
            IndonesiaDistrict::query()->delete();
            IndonesiaRegency::query()->delete();
            IndonesiaProvince::query()->delete();
        }

        $this->info('Fetching cahyadsn/wilayah dataset...');
        $sql = Http::timeout(120)->retry(3, 1000)->get($this->sqlUrl)->throw()->body();

        preg_match_all("/\\('([^']+)'\\s*,\\s*'((?:[^']|\\\\')*)'\\)/", $sql, $matches, PREG_SET_ORDER);

        $provinces = [];
        $regencies = [];
        $districts = [];
        $villages = [];

        foreach ($matches as $match) {
            $code = (string) $match[1];
            $name = str_replace("\\'", "'", (string) $match[2]);
            $level = substr_count($code, '.') + 1;

            if ($level === 1) {
                $provinces[] = ['code' => $code, 'name' => $name];
            } elseif ($level === 2) {
                $regencies[] = ['code' => $code, 'province_code' => substr($code, 0, 2), 'name' => $name];
            } elseif ($level === 3) {
                $districts[] = ['code' => $code, 'regency_code' => substr($code, 0, 5), 'name' => $name];
            } elseif ($level === 4) {
                $villages[] = ['code' => $code, 'district_code' => substr($code, 0, 8), 'name' => $name];
            }
        }

        $provinceCodes = array_fill_keys(array_column($provinces, 'code'), true);
        $regencies = array_values(array_filter($regencies, fn (array $row) => isset($provinceCodes[$row['province_code']])));

        $regencyCodes = array_fill_keys(array_column($regencies, 'code'), true);
        $districts = array_values(array_filter($districts, fn (array $row) => isset($regencyCodes[$row['regency_code']])));

        $districtCodes = array_fill_keys(array_column($districts, 'code'), true);
        $villages = array_values(array_filter($villages, fn (array $row) => isset($districtCodes[$row['district_code']])));

        $this->upsert(IndonesiaProvince::class, $provinces);
        $this->upsert(IndonesiaRegency::class, $regencies);
        $this->upsert(IndonesiaDistrict::class, $districts);
        $this->upsert(IndonesiaVillage::class, $villages);

        $this->info('Selesai: '.count($provinces).' provinsi, '.count($regencies).' kab/kota, '.count($districts).' kecamatan, '.count($villages).' desa/kelurahan.');

        return self::SUCCESS;
    }

    /** @param array<int, array<string, mixed>> $rows */
    private function upsert(string $modelClass, array $rows): void
    {
        $chunk = [];
        $seen = [];

        foreach ($rows as $row) {
            $code = (string) ($row['code'] ?? '');
            if ($code === '' || isset($seen[$code])) {
                continue;
            }

            $seen[$code] = true;
            $now = now();
            $chunk[] = $row + ['created_at' => $now, 'updated_at' => $now];

            if (count($chunk) >= 1000) {
                $this->upsertChunk($modelClass, $chunk);
                $chunk = [];
            }
        }

        if ($chunk !== []) {
            $this->upsertChunk($modelClass, $chunk);
        }
    }

    /** @param array<int, array<string, mixed>> $payload */
    private function upsertChunk(string $modelClass, array $payload): void
    {
        $updateColumns = array_values(array_diff(array_keys($payload[0] ?? []), ['code', 'created_at']));
        $modelClass::query()->upsert($payload, ['code'], $updateColumns);
    }
}
