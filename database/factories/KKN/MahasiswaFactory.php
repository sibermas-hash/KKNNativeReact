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
            'fakultas_id' => $fakultas,
            'prodi_id' => Prodi::factory()->for($fakultas, 'fakultas'),
            'batch_year' => $this->faker->numberBetween(2020, 2026),
            'sks_completed' => $this->faker->numberBetween(120, 150),
            'gpa' => $this->faker->randomFloat(2, 3.0, 4.0),
            'is_bta_ppi_passed' => true,
            'health_certificate_path' => 'health-certificates/default.pdf',
            'parent_permission_path' => 'parent-permissions/default.pdf',
            'gender' => $this->faker->randomElement(['L', 'P']),
            'birth_place' => $this->faker->city(),
            'birth_date' => $this->faker->date(),
        ];
    }
}
