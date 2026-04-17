<?php

namespace Database\Factories\KKN;

use App\Enums\KknType;
use App\Models\KKN\Periode;
use App\Models\KKN\TahunAkademik;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

class PeriodeFactory extends Factory
{
    protected $model = Periode::class;

    public function definition(): array
    {
        $start = Carbon::now()->addMonths($this->faker->numberBetween(1, 4));
        $end = (clone $start)->addWeeks(8);
        $registrationStart = (clone $start)->subWeeks(4);
        $registrationEnd = (clone $start)->subWeek();

        return [
            'academic_year_id' => TahunAkademik::factory(),
            'periode' => $this->faker->numberBetween(1, 99),
            'jenis' => KknType::REGULER,
            'program_type' => Periode::PROGRAM_TYPE_REGULER,
            'registration_mode' => Periode::REGISTRATION_MODE_OPEN,
            'placement_mode' => Periode::PLACEMENT_MODE_AUTOMATIC_AFTER_APPROVAL,
            'kuota' => 2000,
            'name' => 'Periode '.$this->faker->unique()->word(),
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
            'registration_start' => $registrationStart->toDateString(),
            'registration_end' => $registrationEnd->toDateString(),
            'is_active' => false,
            'current_phase' => 'registration',
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

    public function registration(): static
    {
        return $this->active()->state([
            'current_phase' => 'registration',
        ]);
    }

    public function execution(): static
    {
        return $this->active()->state([
            'current_phase' => 'execution',
        ]);
    }

    public function grading(): static
    {
        return $this->active()->state([
            'current_phase' => 'grading',
        ]);
    }
}
