<?php

namespace Database\Factories\KKN;

use App\Models\KKN\Lokasi;
use Illuminate\Database\Eloquent\Factories\Factory;

class LokasiFactory extends Factory
{
    protected $model = Lokasi::class;

    public function definition(): array
    {
        return [
            'province_id' => (string) $this->faker->numberBetween(1, 34),
            'regency_id' => (string) $this->faker->numberBetween(1, 500),
            'district_id' => (string) $this->faker->numberBetween(1, 7000),
            'regency_name' => 'Kabupaten ' . $this->faker->city(),
            'district_name' => 'Kecamatan ' . $this->faker->citySuffix(),
            'village_code' => $this->faker->unique()->numerify('##########'),
            'village_name' => 'Desa ' . $this->faker->city(),
            'address' => null,
            'latitude' => null,
            'longitude' => null,
            'capacity' => 0,
        ];
    }
}
