<?php

namespace Database\Seeders;

use App\Models\KKN\Fakultas as Faculty;
use App\Models\KKN\Dosen as Lecturer;
use App\Models\KKN\Prodi as Program;
use App\Models\KKN\Mahasiswa as Student;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SampleUserSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local')) {
            $this->command?->warn('SampleUserSeeder dilewati karena hanya diizinkan pada environment local.');
            return;
        }

        $defaultPassword = env('KKN_LOCAL_SEED_PASSWORD');
        $studentPassword = $defaultPassword ?: Str::password(16);
        $lecturerPassword = $defaultPassword ?: Str::password(16);

        $faculty = Faculty::first() ?? Faculty::create([
            'code' => 'F00',
            'nama' => 'Fakultas Umum',
        ]);

        $program = Program::first() ?? Program::create([
            'faculty_id' => $faculty->id,
            'code' => 'P00',
            'nama' => 'Program Umum',
        ]);

        $studentUser = User::firstOrCreate(
        ['email' => 'student@kkn.uinsaizu.ac.id'],
        [
            'username' => 'student',
            'name' => 'Mahasiswa Contoh',
            'is_active' => true,
            'password' => Hash::make($studentPassword),
        ]
        );

        if ($studentUser->wasRecentlyCreated) {
            $this->command?->warn("Akun student lokal dibuat. Password awal: {$studentPassword}");
        }

        Student::firstOrCreate(
        ['user_id' => $studentUser->id],
        [
            'nim' => '202600001',
            'nama' => $studentUser->name,
            'faculty_id' => $faculty->id,
            'program_id' => $program->id,
            'batch_year' => 2026,
            'gender' => 'L',
        ]
        );

        if (!$studentUser->hasRole('student')) {
            $studentUser->assignRole('student');
        }

        $lecturerUser = User::firstOrCreate(
        ['email' => 'dpl@kkn.uinsaizu.ac.id'],
        [
            'username' => 'dpl',
            'name' => 'DPL Contoh',
            'is_active' => true,
            'password' => Hash::make($lecturerPassword),
        ]
        );

        if ($lecturerUser->wasRecentlyCreated) {
            $this->command?->warn("Akun DPL lokal dibuat. Password awal: {$lecturerPassword}");
        }

        Lecturer::firstOrCreate(
        ['user_id' => $lecturerUser->id],
        [
            'nip' => '198600001',
            'nama' => $lecturerUser->name,
            'faculty_id' => $faculty->id,
        ]
        );

        if (!$lecturerUser->hasRole('dpl')) {
            $lecturerUser->assignRole('dpl');
        }
    }
}
