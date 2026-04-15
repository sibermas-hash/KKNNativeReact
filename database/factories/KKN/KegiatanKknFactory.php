<?php

namespace Database\Factories\KKN;

use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use Illuminate\Database\Eloquent\Factories\Factory;

class KegiatanKknFactory extends Factory
{
    protected $model = KegiatanKkn::class;

    public function definition(): array
    {
        return [
            'mahasiswa_id' => Mahasiswa::factory(),
            'kelompok_id' => KelompokKkn::factory(),
            'date' => $this->faker->date(),
            'title' => 'Kegiatan '.$this->faker->words(3, true),
            'activity' => $this->faker->paragraph(),
            'reflection' => $this->faker->sentence(),
            'output' => $this->faker->sentence(),
            'location_name' => $this->faker->city(),
            'status' => 'submitted',
        ];
    }
}
