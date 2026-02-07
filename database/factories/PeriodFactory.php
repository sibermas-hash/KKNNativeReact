<?php

namespace Database\Factories;

use App\Models\AcademicYear;
use App\Models\Period;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

class PeriodFactory extends Factory
{
    protected $model = Period::class;

    public function definition(): array
    {
        $start = Carbon::now()->addMonths($this->faker->numberBetween(1, 4));
        $end = (clone $start)->addWeeks(8);
        $registrationStart = (clone $start)->subWeeks(4);
        $registrationEnd = (clone $start)->subWeek();

        return [
            'academic_year_id' => AcademicYear::factory(),
            'name' => 'Periode ' . $this->faker->unique()->word(),
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
            'registration_start' => $registrationStart->toDateString(),
            'registration_end' => $registrationEnd->toDateString(),
            'is_active' => false,
        ];
    }

    public function active(): static
    {
        $start = Carbon::now()->addWeeks(2);
        $end = (clone $start)->addWeeks(8);

        return $this->state([
            'is_active' => true,
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
            'registration_start' => Carbon::now()->subWeek()->toDateString(),
            'registration_end' => Carbon::now()->addWeek()->toDateString(),
        ]);
    }
}
