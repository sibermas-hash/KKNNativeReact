<?php

namespace Database\Factories\KKN;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Periode;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class KelompokKknFactory extends Factory
{
    protected $model = KelompokKkn::class;

    public function definition(): array
    {
        return [
            'period_id' => Periode::factory(),
            'location_id' => Lokasi::factory(),
            'code' => strtoupper($this->faker->unique()->bothify('KKN-####')),
            'nama_kelompok' => 'Kelompok '.$this->faker->numberBetween(1, 100),
            'token' => Str::random(10),
            'capacity' => 10,
            'status' => 'active',
        ];
    }
}
