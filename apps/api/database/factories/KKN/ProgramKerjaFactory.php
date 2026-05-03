<?php

namespace Database\Factories\KKN;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\ProgramKerja;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProgramKerjaFactory extends Factory
{
    protected $model = ProgramKerja::class;

    public function definition(): array
    {
        return [
            'kelompok_id' => KelompokKkn::factory(),
            'title' => 'Program '.$this->faker->words(3, true),
            'description' => $this->faker->paragraph(),
            'sdg_goals' => null,
            'objectives' => $this->faker->sentence(),
            'target_participants' => $this->faker->numberBetween(10, 100),
            'budget' => $this->faker->randomFloat(2, 100000, 1000000),
            'status' => 'submitted',
        ];
    }
}
