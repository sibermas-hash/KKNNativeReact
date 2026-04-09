<?php

namespace App\Imports;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Periode;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class KelompokKknImport implements ToCollection, WithHeadingRow
{
    public int $createdCount = 0;
    public int $updatedCount = 0;
    public int $skippedCount = 0;

    /** @var array<int, string> */
    public array $errors = [];

    public function collection(Collection $rows): void
    {
        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;
            $code = $this->value($row, ['kode_kelompok', 'group_code', 'code']);
            $name = $this->value($row, ['nama_kelompok', 'group_name', 'name']);

            if (! filled($code) && ! filled($name)) {
                $this->skippedCount++;

                continue;
            }

            if (! filled($code) || ! filled($name)) {
                $this->errors[] = "Baris {$rowNumber}: kode_kelompok dan nama_kelompok wajib diisi.";

                continue;
            }

            $period = $this->resolvePeriod($row);
            if (! $period) {
                $this->errors[] = "Baris {$rowNumber}: periode tidak dikenali.";

                continue;
            }

            $location = $this->resolveLocation($row);
            if (! $location) {
                $this->errors[] = "Baris {$rowNumber}: data lokasi belum lengkap. Pastikan desa, kecamatan, dan kabupaten terisi.";

                continue;
            }

            $capacity = (int) ($this->value($row, ['kapasitas', 'capacity']) ?? 10);
            $capacity = max(1, min($capacity, 50));

            $status = strtolower((string) ($this->value($row, ['status']) ?? 'draft'));
            if (! in_array($status, ['draft', 'active', 'closed'], true)) {
                $this->errors[] = "Baris {$rowNumber}: status harus draft, active, atau closed.";

                continue;
            }

            $group = KelompokKkn::query()->firstOrNew([
                'period_id' => $period->id,
                'code' => $code,
            ]);

            $isExisting = $group->exists;

            $group->fill([
                'period_id' => $period->id,
                'location_id' => $location->id,
                'nama_kelompok' => $name,
                'capacity' => $capacity,
                'status' => $status,
                'code' => $code,
                'token' => $group->token ?: strtoupper(Str::random(8)),
            ]);

            if (! $group->isDirty() && $isExisting) {
                $this->skippedCount++;

                continue;
            }

            $group->save();

            if ($isExisting) {
                $this->updatedCount++;
            } else {
                $this->createdCount++;
            }
        }
    }

    private function resolvePeriod(Collection $row): ?Periode
    {
        $periodId = $this->value($row, ['period_id', 'periode_id']);
        if (filled($periodId) && is_numeric($periodId)) {
            return Periode::query()->find((int) $periodId);
        }

        $periodName = $this->value($row, ['periode', 'period_name', 'nama_periode']);
        if (filled($periodName)) {
            $query = Periode::query()->where('name', $periodName);

            if (is_numeric($periodName)) {
                $query->orWhere('periode', (int) $periodName);
            }

            return $query->first();
        }

        return null;
    }

    private function resolveLocation(Collection $row): ?Lokasi
    {
        $locationId = $this->value($row, ['location_id', 'lokasi_id']);
        if (filled($locationId) && is_numeric($locationId)) {
            return Lokasi::query()->find((int) $locationId);
        }

        $villageName = $this->value($row, ['desa', 'village_name', 'nama_desa']);
        $districtName = $this->value($row, ['kecamatan', 'district_name', 'nama_kecamatan']);
        $regencyName = $this->value($row, ['kabupaten', 'regency_name', 'nama_kabupaten']);

        if (! filled($villageName) || ! filled($districtName) || ! filled($regencyName)) {
            return null;
        }

        $location = Lokasi::query()->firstOrNew([
            'village_name' => $villageName,
            'district_name' => $districtName,
            'regency_name' => $regencyName,
        ]);

        $location->fill([
            'village_name' => $villageName,
            'district_name' => $districtName,
            'regency_name' => $regencyName,
            'village_code' => $this->value($row, ['kode_desa', 'village_code', 'kode_wilayah']) ?: $location->village_code,
            'address' => $this->value($row, ['alamat_lokasi', 'address']) ?: $location->address,
        ]);

        if (! $location->exists || $location->isDirty()) {
            $location->save();
        }

        return $location;
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
