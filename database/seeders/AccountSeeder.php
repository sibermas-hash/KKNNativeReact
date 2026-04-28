<?php

namespace Database\Seeders;

use App\Models\KKN\Dosen as Lecturer;
use App\Models\KKN\Fakultas as Faculty;
use App\Models\KKN\Mahasiswa as Student;
use App\Models\KKN\Prodi as Program;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class AccountSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local')) {
            $this->command?->warn('AccountSeeder dilewati karena hanya diizinkan pada environment local.');

            return;
        }

        $defaultPassword = env('KKN_LOCAL_SEED_PASSWORD');
        $studentPassword = $defaultPassword ?: 'password';
        $lecturerPassword = $defaultPassword ?: 'password';

        $this->command->info('Start seeding roles...');
        // Pastikan role ada
        $roles = ['superadmin', 'dpl', 'student'];
        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }
        $this->command->info('Roles seeded.');

        $this->command->info('Seeding faculty...');
        $faculty = Faculty::firstOrCreate(['code' => 'FTIK'], [
            'nama' => 'Fakultas Tarbiyah dan Ilmu Keguruan',
        ]);
        $this->command->info('Faculty seeded.');

        $this->command->info('Seeding program...');
        $program = Program::firstOrCreate(['code' => 'PAI', 'fakultas_id' => $faculty->id], [
            'nama' => 'Pendidikan Agama Islam',
        ]);
        $this->command->info('Program seeded.');

        // Akun Mahasiswa
        $this->command->info('Creating student user...');
        $studentUser = User::firstOrCreate(
            ['email' => 'mahasiswa@uinsaizu.ac.id'],
            [
                'username' => 'mahasiswa',
                'name' => 'Budi Mahasiswa',
                'is_active' => true,
                'password' => Hash::make($studentPassword),
            ]
        );
        $this->command->info('Student user created: '.$studentUser->username);
        if ($studentUser->wasRecentlyCreated) {
            $this->command?->warn("Password awal mahasiswa lokal: {$studentPassword}");
        }

        $this->command->info('Creating student profile...');
        Student::updateOrCreate(
            ['user_id' => $studentUser->id],
            [
                'nim' => '214110001',
                'nama' => 'Budi Mahasiswa',
                'fakultas_id' => $faculty->id,
                'prodi_id' => $program->id,
                'batch_year' => 2021,
                'gender' => 'L',
            ]
        );
        $this->command->info('Student profile created.');

        if (! $studentUser->hasRole('student')) {
            $studentUser->assignRole('student');
            $this->command->info('Student role assigned.');
        }

        // Akun DPL / Dosen
        $this->command->info('Creating lecturer user...');
        $lecturerUser = User::firstOrCreate(
            ['email' => 'dosen@uinsaizu.ac.id'],
            [
                'username' => 'dosen',
                'name' => 'Dr. Ahmad Dosen, M.Pd.',
                'is_active' => true,
                'password' => Hash::make($lecturerPassword),
            ]
        );
        $this->command->info('Lecturer user created: '.$lecturerUser->username);
        if ($lecturerUser->wasRecentlyCreated) {
            $this->command?->warn("Password awal DPL lokal: {$lecturerPassword}");
        }

        $this->command->info('Creating lecturer profile...');
        Lecturer::updateOrCreate(
            ['user_id' => $lecturerUser->id],
            [
                'nip' => '198501012024011',
                'nama' => 'Dr. Ahmad Dosen, M.Pd.',
                'fakultas_id' => $faculty->id,
            ]
        );
        $this->command->info('Lecturer profile created.');

        if (! $lecturerUser->hasRole('dosen')) {
            $lecturerUser->assignRole('dosen');
            $this->command->info('DPL role assigned.');
        }

        $this->command->info('Seeding completed successfully.');
    }
}
