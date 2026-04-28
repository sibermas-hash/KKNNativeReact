<?php

namespace Database\Seeders;

use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class FakeStudentRegistrationSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create or Find User
        $user = User::updateOrCreate(
            ['username' => 'mhs_tester'],
            [
                'name' => 'Mahasiswa Tester Lengkap',
                'email' => 'mhs.tester@example.com',
                'password' => Hash::make(env('KKN_LOCAL_SEED_PASSWORD', 'password')),
                'phone' => '081234567890',
                'address' => 'Jl. Kampus No. 123, Purwokerto',
                'domicile_village_name' => 'Bancarkembar',
                'domicile_district_name' => 'Purwokerto Utara',
                'domicile_regency_name' => 'Banyumas',
                'address_verified_at' => now(),
            ]
        );
        $user->assignRole('student');

        // 2. Create or Find Mahasiswa record
        $mahasiswa = Mahasiswa::updateOrCreate(
            ['user_id' => $user->id],
            [
                'nim' => '2141100001',
                'nama' => $user->name,
                'nik' => '3302123456780001',
                'mother_name' => 'Siti Aminah',
                'birth_place' => 'Banyumas',
                'birth_date' => '2003-05-15',
                'gender' => 'L',
                'shirt_size' => 'XL',
                'sks_completed' => 110,
                'gpa' => 3.75,
                'status_bta_ppi' => 'LULUS',
                'batch_year' => 2021,
                'semester' => 6,
            ]
        );

        // 3. Create Fake Documents in Storage
        $disk = Storage::disk(config('filesystems.default'));

        $healthPath = 'health-certificates/fake_health_cert_'.$mahasiswa->nim.'.pdf';
        $parentPath = 'parent-permissions/fake_parent_permit_'.$mahasiswa->nim.'.pdf';

        if (! $disk->exists($healthPath)) {
            $disk->put($healthPath, 'DUMMY PDF CONTENT FOR HEALTH CERTIFICATE');
        }

        if (! $disk->exists($parentPath)) {
            $disk->put($parentPath, 'DUMMY PDF CONTENT FOR PARENT PERMISSION');
        }

        $mahasiswa->update([
            'health_certificate_path' => $healthPath,
            'parent_permission_path' => $parentPath,
        ]);

        // 4. Create Registration (PesertaKkn) for ALL periods that might be visible
        $periods = Periode::all();

        foreach ($periods as $period) {
            PesertaKkn::updateOrCreate(
                [
                    'mahasiswa_id' => $mahasiswa->id,
                    'periode_id' => $period->id,
                ],
                [
                    'status' => 'pending',
                    'registration_date' => now(),
                    'notes' => 'Pendaftaran simulasi dengan dokumen lengkap untuk testing audit.',
                ]
            );
        }

        $this->command->info('Fake student "mhs_tester" (NIM: 2141100001) has been created with complete documents in ALL periods.');
    }
}
