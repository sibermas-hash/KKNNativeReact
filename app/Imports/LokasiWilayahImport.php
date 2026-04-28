<?php

declare(strict_types=1);

namespace App\Imports;

use App\Models\KKN\Lokasi;
use App\Services\EmsifaService;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class LokasiWilayahImport implements ToCollection, WithHeadingRow
{
    public int $createdCount = 0;

    public int $updatedCount = 0;

    public int $skippedCount = 0;

    public function collection(Collection $rows): void
    {
        foreach ($rows as $index => $row) {
            $villageName = $this->value($row, ['desa', 'village_name', 'nama_desa']);
            $districtName = $this->value($row, ['kecamatan', 'district_name', 'nama_kecamatan']);
            $regencyName = $this->value($row, ['kabupaten', 'regency_name', 'nama_kabupaten']);
            $villageCode = $this->value($row, ['kode_desa', 'village_code', 'kode_wilayah', 'kode_bps']);
            $capacity = $this->value($row, ['kapasitas', 'capacity']);

            if (! filled($villageName) && ! filled($districtName) && ! filled($regencyName)) {
                $this->skippedCount++;

                continue;
            }

            if (! filled($villageName) || ! filled($districtName) || ! filled($regencyName)) {
                throw ValidationException::withMessages([
                    'file' => 'Setiap baris Excel wajib berisi kolom desa, kecamatan, dan kabupaten. Error pada baris '.($index + 2).'.',
                ]);
            }

            if (! filled($villageCode)) {
                $emsifa = new EmsifaService;
                $villageCode = $emsifa->findVillageCode($regencyName, $districtName, $villageName);

                if (! filled($villageCode)) {
                    throw ValidationException::withMessages([
                        'file' => 'Sistem Menolak: Baris '.($index + 2)." tidak valid! Kombinasi Desa '{$villageName}', Kecamatan '{$districtName}', di '{$regencyName}' tidak terdaftar resmi di BPS (Emsifa). Pastikan hierarki dan ejaannya benar.",
                    ]);
                }
            }

            $location = Lokasi::query()->firstOrNew([
                'village_name' => $villageName,
                'district_name' => $districtName,
                'regency_name' => $regencyName,
            ]);

            $isExisting = $location->exists;

            $location->fill([
                'village_name' => $villageName,
                'district_name' => $districtName,
                'regency_name' => $regencyName,
                'village_code' => $villageCode ?: $location->village_code,
                'capacity' => $capacity !== null ? (int) $capacity : ($location->capacity ?? 0),
            ]);

            if (! $location->isDirty() && $isExisting) {
                continue;
            }

            $location->save();

            if ($isExisting) {
                $this->updatedCount++;
            } else {
                $this->createdCount++;
            }
        }
    }

    private function value(Collection $row, array $keys): ?string
    {
        foreach ($keys as $key) {
            $value = $row->get($key);

            if ($value === null) {
                continue;
            }

            $normalized = trim((string) $value);

            if ($normalized !== '') {
                return $normalized;
            }
        }

        return null;
    }
}
