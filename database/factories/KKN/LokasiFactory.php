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
            'village_code' => $this->faker->unique()->numerify('##########'),
            'village_name' => $this->faker->city(),
            'address' => $this->faker->address(),
            'latitude' => $this->faker->latitude(-8, -6),
            'longitude' => $this->faker->longitude(106, 115),
            'capacity' => $this->faker->numberBetween(10, 30),
        ];
    }
}
