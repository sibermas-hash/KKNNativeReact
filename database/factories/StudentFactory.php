<?php

namespace Database\Factories;

use App\Models\Faculty;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Spatie\Permission\Models\Role;

class StudentFactory extends Factory
{
    protected $model = Student::class;

    public function configure(): static
    {
        return $this->afterCreating(function (Student $student) {
            $role = Role::firstOrCreate([
                'name' => 'student',
                'guard_name' => 'web',
            ]);

            $student->user->assignRole($role);
        });
    }

    public function definition(): array
    {
        $faculty = Faculty::factory();
        $program = Program::factory()->for($faculty);

        return [
            'user_id' => User::factory(),
            'nim' => $this->faker->unique()->numerify('##########'),
            'name' => $this->faker->name(),
            'faculty_id' => $faculty,
            'program_id' => $program,
            'batch_year' => $this->faker->numberBetween(2018, 2026),
            'gender' => $this->faker->randomElement(['L', 'P']),
            'birth_place' => $this->faker->city(),
            'birth_date' => $this->faker->date(),
        ];
    }
}
