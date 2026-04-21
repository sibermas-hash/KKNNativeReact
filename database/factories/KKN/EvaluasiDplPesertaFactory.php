<?php

namespace Database\Factories\KKN;

use App\Models\KKN\Dosen;
use App\Models\KKN\EvaluasiDplPeserta;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use Illuminate\Database\Eloquent\Factories\Factory;

class EvaluasiDplPesertaFactory extends Factory
{
    protected $model = EvaluasiDplPeserta::class;

    public function definition(): array
    {
        return [
            'periode_id' => Periode::factory(),
            'kelompok_id' => KelompokKkn::factory(),
            'mahasiswa_id' => Mahasiswa::factory(),
            'dosen_id' => Dosen::factory(),
            'total_score' => $this->faker->randomFloat(2, 3.5, 5),
            'recommendation' => $this->faker->randomElement([
                'sangat_direkomendasikan',
                'direkomendasikan',
                'cukup',
            ]),
            'notes' => $this->faker->optional()->sentence(),
            'submitted_at' => now(),
            'is_anonymous_to_dpl' => true,
        ];
    }
}
