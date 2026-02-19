<?php

namespace Database\Factories\KKN;

use App\Models\KKN\TahunAkademik;
use Illuminate\Database\Eloquent\Factories\Factory;

class TahunAkademikFactory extends Factory
{
    protected $model = TahunAkademik::class;

    public function definition(): array
    {
        $startYear = $this->faker->numberBetween(2020, 2030);

        return [
            'year' => $startYear . '/' . ($startYear + 1),
            'is_active' => false,
        ];
    }

    public function active(): static
    {
        return $this->state(['is_active' => true]);
    }
}
