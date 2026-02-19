<?php

namespace Database\Factories\KKN;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\NilaiKkn;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class NilaiKknFactory extends Factory
{
    protected $model = NilaiKkn::class;

    public function definition(): array
    {
        return [
            // FK references users.id (legacy from original kkn_scores.student_id constrained('users'))
            'mahasiswa_id' => User::factory(),
            'kelompok_id' => KelompokKkn::factory(),
            'final_report_score' => $this->faker->randomFloat(2, 60, 100),
            'execution_score' => $this->faker->randomFloat(2, 60, 100),
            'article_score' => $this->faker->randomFloat(2, 60, 100),
            'discipline_score' => $this->faker->randomFloat(2, 60, 100),
            'attitude_score' => $this->faker->randomFloat(2, 60, 100),
            'workshop_score' => $this->faker->randomFloat(2, 60, 100),
            'administration_score' => $this->faker->randomFloat(2, 60, 100),
            'is_finalized' => false,
        ];
    }

    public function finalized(): static
    {
        return $this->state(['is_finalized' => true]);
    }
}
