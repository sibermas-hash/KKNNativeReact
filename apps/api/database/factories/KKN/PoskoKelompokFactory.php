<?php

namespace Database\Factories\KKN;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\PoskoKelompok;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PoskoKelompokFactory extends Factory
{
    protected $model = PoskoKelompok::class;

    public function definition(): array
    {
        return [
            'kelompok_id' => KelompokKkn::factory(),
            'latitude' => $this->faker->latitude(-8, -6),
            'longitude' => $this->faker->longitude(106, 115),
            'photo_path' => 'posko-photos/example.jpg',
            'photo_name' => 'example.jpg',
            'photo_size' => 102400,
            'uploaded_by' => User::factory(),
        ];
    }
}
