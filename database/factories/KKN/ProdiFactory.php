<?php

namespace Database\Factories\KKN;

use App\Models\KKN\Fakultas;
use App\Models\KKN\Prodi;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProdiFactory extends Factory
{
    protected $model = Prodi::class;

    public function definition(): array
    {
        $sequence = (string) $this->faker->unique()->numberBetween(1, 999999);

        return [
            'faculty_id' => Fakultas::factory(),
            'code' => 'P'.$this->faker->unique()->numberBetween(100000, 999999),
            'nama' => 'Program '.$this->faker->unique()->word(),
        ];
    }
}
