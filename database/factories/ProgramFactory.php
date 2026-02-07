<?php

namespace Database\Factories;

use App\Models\Faculty;
use App\Models\Program;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProgramFactory extends Factory
{
    protected $model = Program::class;

    public function definition(): array
    {
        $sequence = (string) $this->faker->unique()->numberBetween(1, 99);

        return [
            'faculty_id' => Faculty::factory(),
            'code' => 'P' . str_pad($sequence, 2, '0', STR_PAD_LEFT),
            'name' => 'Program ' . $this->faker->unique()->word(),
        ];
    }
}
