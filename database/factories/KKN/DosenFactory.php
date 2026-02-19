<?php

namespace Database\Factories\KKN;

use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class DosenFactory extends Factory
{
    protected $model = Dosen::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'nip' => $this->faker->unique()->numerify('################'),
            'nama' => $this->faker->name(),
            'faculty_id' => Fakultas::factory(),
            'phone' => $this->faker->phoneNumber(),
        ];
    }
}
