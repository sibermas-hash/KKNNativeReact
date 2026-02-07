<?php

namespace Database\Factories;

use App\Models\AcademicYear;
use Illuminate\Database\Eloquent\Factories\Factory;

class AcademicYearFactory extends Factory
{
    protected $model = AcademicYear::class;

    public function definition(): array
    {
        $startYear = $this->faker->numberBetween(2020, 2030);

        return [
            'year' => $startYear . '/' . ($startYear + 1),
            'is_active' => false,
        ];
    }
}
