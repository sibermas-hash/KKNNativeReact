<?php

namespace Database\Seeders;

use App\Models\KKN\Lokasi;
use Illuminate\Database\Seeder;

class DummyLocationCoordinatesSeeder extends Seeder
{
    public function run(): void
    {
        // Purwokerto/Banyumas center
        $baseLat = -7.4243;
        $baseLng = 109.2302;

        $locations = Lokasi::take(20)->get();

        foreach ($locations as $i => $loc) {
            // Add some randomness
            $lat = $baseLat + (rand(-100, 100) / 1000);
            $lng = $baseLng + (rand(-100, 100) / 1000);

            $loc->update([
                'latitude' => $lat,
                'longitude' => $lng,
                'address' => "Posko KKN Desa {$loc->village_name}, Kec. {$loc->district_name}",
            ]);
        }
    }
}
