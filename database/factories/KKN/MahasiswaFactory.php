<?php

namespace Database\Factories\KKN;

use App\Models\KKN\Fakultas;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Prodi;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class MahasiswaFactory extends Factory
{
    protected $model = Mahasiswa::class;

    public function definition(): array
    {
        $fakultas = Fakultas::factory();

        return [
            'user_id' => User::factory(),
            'nim' => $this->faker->unique()->numerify('##########'),
            'nama' => $this->faker->name(),
            'faculty_id' => $fakultas,
            'program_id' => Prodi::factory()->for($fakultas, 'fakultas'),
            'batch_year' => $this->faker->numberBetween(2020, 2026),
            'gender' => $this->faker->randomElement(['L', 'P']),
            'birth_place' => $this->faker->city(),
            'birth_date' => $this->faker->date(),
        ];
    }
}
