<?php

namespace Database\Factories\KKN;

use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use Illuminate\Database\Eloquent\Factories\Factory;

class PesertaKknFactory extends Factory
{
    protected $model = PesertaKkn::class;

    public function definition(): array
    {
        return [
            'mahasiswa_id' => Mahasiswa::factory(),
            'periode_id' => Periode::factory(),
            'status' => 'pending',
            'registration_date' => now(),
        ];
    }

    public function approved(): static
    {
        return $this->state([
            'status' => 'approved',
            'approved_at' => now(),
        ]);
    }
}
