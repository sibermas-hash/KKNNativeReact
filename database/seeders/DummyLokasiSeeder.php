<?php

namespace Database\Seeders;

use App\Models\KKN\Lokasi;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;

class DummyLokasiSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Fetching real location data from Emsifa API...');

        $regenciesRes = Http::timeout(15)->get('https://www.emsifa.com/api-wilayah-indonesia/api/regencies/33.json');
        if (! $regenciesRes->ok()) {
            $this->command->error('Failed to fetch regencies from Emsifa.');

            return;
        }

        $allRegencies = collect($regenciesRes->json());

        // Target KABUPATEN BANYUMAS, PURBALINGGA, BANJARNEGARA, CILACAP, KEBUMEN
        $targetNames = [
            'KABUPATEN BANYUMAS',
            'KABUPATEN PURBALINGGA',
            'KABUPATEN BANJARNEGARA',
            'KABUPATEN CILACAP',
            'KABUPATEN KEBUMEN',
        ];

        $targets = $allRegencies->filter(fn ($r) => in_array(strtoupper($r['name']), $targetNames));

        $totalCreated = 0;

        foreach ($targets as $regency) {
            $this->command->info("Processing {$regency['name']}...");
            $districtsRes = Http::timeout(10)->get("https://www.emsifa.com/api-wilayah-indonesia/api/districts/{$regency['id']}.json");
            if (! $districtsRes->ok()) {
                continue;
            }

            // Ambil 5 kecamatan pertama dari tiap kabupaten
            $districts = array_slice($districtsRes->json(), 0, 5);

            foreach ($districts as $district) {
                $villagesRes = Http::timeout(10)->get("https://www.emsifa.com/api-wilayah-indonesia/api/villages/{$district['id']}.json");
                if (! $villagesRes->ok()) {
                    continue;
                }

                // Ambil 5 desa pertama dari tiap kecamatan
                $villages = array_slice($villagesRes->json(), 0, 5);

                foreach ($villages as $village) {
                    Lokasi::firstOrCreate(
                        ['village_code' => $village['id']],
                        [
                            'village_name' => $village['name'],
                            'district_name' => $district['name'],
                            'regency_name' => $regency['name'],
                            'capacity' => rand(15, 25),
                            'province_id' => 33,
                            'regency_id' => $regency['id'],
                            'district_id' => $district['id'],
                        ]
                    );
                    $totalCreated++;
                }
            }
        }

        $this->command->info("Successfully seeded {$totalCreated} real locations from Emsifa API.");
    }
}
