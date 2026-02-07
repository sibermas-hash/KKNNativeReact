<?php

namespace Database\Factories;

use App\Models\Faculty;
use Illuminate\Database\Eloquent\Factories\Factory;

class FacultyFactory extends Factory
{
    protected $model = Faculty::class;

    public function definition(): array
    {
        $sequence = (string) $this->faker->unique()->numberBetween(1, 99);

        return [
            'code' => 'F' . str_pad($sequence, 2, '0', STR_PAD_LEFT),
            'name' => 'Fakultas ' . $this->faker->unique()->word(),
        ];
    }
}
