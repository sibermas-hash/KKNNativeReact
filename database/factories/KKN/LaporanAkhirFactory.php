<?php

namespace Database\Factories\KKN;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\LaporanAkhir;
use App\Models\KKN\Mahasiswa;
use Illuminate\Database\Eloquent\Factories\Factory;

class LaporanAkhirFactory extends Factory
{
    protected $model = LaporanAkhir::class;

    public function definition(): array
    {
        return [
            'mahasiswa_id' => Mahasiswa::factory(),
            'kelompok_id' => KelompokKkn::factory(),
            'title' => 'Laporan Akhir '.$this->faker->words(2, true),
            'abstract' => $this->faker->paragraph(),
            'file_path' => null,
            'file_name' => null,
            'status' => 'submitted',
            'submitted_at' => now(),
            'review_notes' => null,
            'score' => null,
        ];
    }
}
