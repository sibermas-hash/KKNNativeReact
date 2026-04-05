<?php

namespace Database\Factories\KKN;

use App\Models\KKN\AntrianKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use Illuminate\Database\Eloquent\Factories\Factory;

class AntrianKknFactory extends Factory
{
    protected $model = AntrianKkn::class;

    public function definition(): array
    {
        return [
            'mahasiswa_id' => Mahasiswa::factory(),
            'period_id' => Periode::factory(),
            'posisi_antrian' => null,
            'status' => 'menunggu',
            'penalti_poin' => 0,
            'pindah_count' => 0,
            'joined_at' => null,
            'last_left_group_at' => null,
        ];
    }
}
