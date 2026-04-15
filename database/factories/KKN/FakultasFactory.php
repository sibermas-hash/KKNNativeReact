<?php

namespace Database\Factories\KKN;

use App\Models\KKN\Fakultas;
use Illuminate\Database\Eloquent\Factories\Factory;

class FakultasFactory extends Factory
{
    protected $model = Fakultas::class;

    public function definition(): array
    {
        $sequence = (string) $this->faker->unique()->numberBetween(1, 99);

        return [
            'code' => 'F'.str_pad($sequence, 2, '0', STR_PAD_LEFT),
            'nama' => 'Fakultas '.$this->faker->unique()->word(),
        ];
    }
}
