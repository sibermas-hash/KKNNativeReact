<?php

namespace Database\Factories\KKN;

use App\Models\KKN\Fakultas;
use Illuminate\Database\Eloquent\Factories\Factory;

class FakultasFactory extends Factory
{
    protected $model = Fakultas::class;

    public function definition(): array
    {
        $sequence = (string) $this->faker->unique()->numberBetween(1, 999999);

        return [
            'code' => 'F'.$this->faker->unique()->numberBetween(100000, 999999),
            'nama' => 'Fakultas '.$this->faker->unique()->word(),
        ];
    }
}
