<?php

namespace Database\Seeders;

use App\Models\Faculty;
use App\Models\Lecturer;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SampleUserSeeder extends Seeder
{
    public function run(): void
    {
        $faculty = Faculty::first() ?? Faculty::create([
            'code' => 'F00',
            'name' => 'Fakultas Umum',
        ]);

        $program = Program::first() ?? Program::create([
            'faculty_id' => $faculty->id,
            'code' => 'P00',
            'name' => 'Program Umum',
        ]);

        $studentUser = User::firstOrCreate(
            ['email' => 'student@kkn.uinsaizu.ac.id'],
            [
                'username' => 'student',
                'name' => 'Mahasiswa Contoh',
                'is_active' => true,
                'password' => Hash::make('password'),
            ]
        );

        Student::firstOrCreate(
            ['user_id' => $studentUser->id],
            [
                'nim' => '202600001',
                'name' => $studentUser->name,
                'faculty_id' => $faculty->id,
                'program_id' => $program->id,
                'batch_year' => 2026,
                'gender' => 'L',
            ]
        );

        if (! $studentUser->hasRole('student')) {
            $studentUser->assignRole('student');
        }

        $lecturerUser = User::firstOrCreate(
            ['email' => 'dpl@kkn.uinsaizu.ac.id'],
            [
                'username' => 'dpl',
                'name' => 'DPL Contoh',
                'is_active' => true,
                'password' => Hash::make('password'),
            ]
        );

        Lecturer::firstOrCreate(
            ['user_id' => $lecturerUser->id],
            [
                'nip' => '198600001',
                'name' => $lecturerUser->name,
                'faculty_id' => $faculty->id,
            ]
        );

        if (! $lecturerUser->hasRole('dpl')) {
            $lecturerUser->assignRole('dpl');
        }
    }
}
