<?php

namespace Database\Factories;

use App\Models\Faculty;
use App\Models\Lecturer;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class LecturerFactory extends Factory
{
    protected $model = Lecturer::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'nip' => $this->faker->unique()->numerify('################'),
            'name' => $this->faker->name(),
            'faculty_id' => Faculty::factory(),
            'phone' => $this->faker->phoneNumber(),
        ];
    }
}
