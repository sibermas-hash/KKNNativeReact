<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\KKN\Dosen;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\TahunAkademik;
use App\Models\KKN\Fakultas;
use App\Models\KKN\Prodi;
use App\Models\KKN\DplPeriod;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Str;

class MultiDplSampleSeederV2 extends Seeder
{
    public function run()
    {
        if (!app()->environment('local', 'testing')) {
            $this->command->error('This seeder can only run in local or testing environment.');
            return;
        }

        // NO Transaction here because of cross-connection issues
        $this->command->info('Start seeding Multi-DPL Sample Data...');

        // 1. Setup Roles
        $roleDpl = Role::firstOrCreate(['name' => 'dpl', 'guard_name' => 'web']);
        $roleMhs = Role::firstOrCreate(['name' => 'mahasiswa', 'guard_name' => 'web']);

        // 2. Create Tahun Akademik
        $ta = TahunAkademik::updateOrCreate(
        ['year' => '2025/2026'],
        ['is_active' => true]
        );

        // 3. Create Periode
        $periode = Periode::updateOrCreate(
        ['name' => 'Angkatan 99 (Sample)'],
        [
            'academic_year_id' => $ta->id,
            'angkatan' => 99,
            'start_date' => now(),
            'end_date' => now()->addMonths(2),
            'registration_start' => now()->subDays(14),
            'registration_end' => now(),
            'is_active' => true,
            'jenis' => 'regular'
        ]
        );

        // 4. Create Lokasi
        $lokasi = Lokasi::updateOrCreate(
        ['village_code' => '001'],
        [
            'village_name' => 'Desa Penari',
            'district_id' => '01',
            'regency_id' => '01',
            'province_id' => '01',
            'capacity' => 10
        ]
        );

        // 5. Create Fakultas & Prodi
        $fakultas = Fakultas::updateOrCreate(
        ['code' => 'FST'],
        ['nama' => 'Fakultas Sains dan Teknologi']
        );

        $prodi = Prodi::updateOrCreate(
        ['code' => 'TI'],
        [
            'nama' => 'Teknik Informatika',
            'faculty_id' => $fakultas->id
        ]
        );

        // 6. Create DPL Users & Dosen Profiles
        // DPL Ketua
        $uKetua = User::updateOrCreate(
        ['email' => 'dpl.ketua@example.com'],
        [
            'name' => 'Dr. Sutrisno (Ketua)',
            'username' => 'dplketua',
            'password' => Hash::make(env('KKN_LOCAL_SEED_PASSWORD', Str::random(32))),
            'is_active' => true,
            'phone' => '081234567890',
        ]
        );
        $uKetua->assignRole($roleDpl);

        $dKetua = Dosen::updateOrCreate(
        ['user_id' => $uKetua->id],
        [
            'nama' => $uKetua->name,
            'nip' => '198001012023011001',
            'faculty_id' => $fakultas->id
        ]
        );

        // DplPeriod Ketua
        DplPeriod::updateOrCreate(
        ['dosen_id' => $dKetua->id, 'period_id' => $periode->id],
        ['max_groups' => 2, 'is_active' => true]
        );

        // DPL Anggota
        $uAnggota = User::updateOrCreate(
        ['email' => 'dpl.anggota@example.com'],
        [
            'name' => 'Budi Santoso, M.Kom (Anggota)',
            'username' => 'dplanggota',
            'password' => Hash::make(env('KKN_LOCAL_SEED_PASSWORD', Str::random(32))),
            'is_active' => true,
            'phone' => '081234567891',
        ]
        );
        $uAnggota->assignRole($roleDpl);

        $dAnggota = Dosen::updateOrCreate(
        ['user_id' => $uAnggota->id],
        [
            'nama' => $uAnggota->name,
            'nip' => '199001012023011002',
            'faculty_id' => $fakultas->id
        ]
        );

        // DplPeriod Anggota
        DplPeriod::updateOrCreate(
        ['dosen_id' => $dAnggota->id, 'period_id' => $periode->id],
        ['max_groups' => 2, 'is_active' => true]
        );

        // 7. Create Group
        $group = KelompokKkn::updateOrCreate(
        ['nama_kelompok' => 'Kelompok 99 - Desa Penari'],
        [
            'period_id' => $periode->id,
            'location_id' => $lokasi->id,
            'code' => 'KKN-Sample-99',
            'capacity' => 20,
            'status' => 'active',
            'token' => Str::upper(Str::random(6)),
            'dpl_id' => $dKetua->id, // Legacy support
        ]
        );

        // 8. Assign DPLs (Multi-DPL Logic)
        $group->dosen()->syncWithoutDetaching([
            $dKetua->id => ['role' => 'Ketua'],
            $dAnggota->id => ['role' => 'Anggota'],
        ]);

        $this->command->info("- Group '{$group->nama_kelompok}' created/updated.");

        // 9. Create Students
        for ($i = 1; $i <= 5; $i++) {
            $email = "mhs.sample.$i@example.com";
            $uMhs = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => "Mahasiswa Sample $i",
                'username' => "mhs$i" . rand(100, 999),
                'password' => Hash::make(env('KKN_LOCAL_SEED_PASSWORD', Str::random(32))),
                'is_active' => true,
            ]
            );
            $uMhs->assignRole($roleMhs);

            $mhs = Mahasiswa::updateOrCreate(
            ['user_id' => $uMhs->id],
            [
                'nim' => '2026' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'nama' => $uMhs->name,
                'faculty_id' => $fakultas->id,
                'program_id' => $prodi->id,
                'batch_year' => 2023,
                'gender' => ($i % 2 == 0) ? 'P' : 'L',
            ]
            );

            // Add to PesertaKkn (Mahasiswa -> Group)
            PesertaKkn::updateOrCreate(
            [
                'mahasiswa_id' => $mhs->id,
                'kelompok_id' => $group->id,
            ],
            [
                'period_id' => $periode->id,
                'status' => 'approved',
                'registration_date' => now(),
                'approved_at' => now(),
                'approved_by' => $uKetua->id,
            ]
            );

            // Create NilaiKkn using User ID (as per Controller logic)
            NilaiKkn::updateOrCreate(
            [
                'mahasiswa_id' => $uMhs->id,
                'kelompok_id' => $group->id,
            ],
            [
                'discipline_score' => rand(80, 95),
                'attitude_score' => rand(75, 90),
                'village_graded_by' => $uKetua->id,
                'village_graded_at' => now(),
                'evidence_file' => 'evidence/sample_blanko.pdf',
            ]
            );
        }

        $this->command->info("- 5 Students created/updated and assigned to group.");
        $this->command->info("Seeding V2 completed successfully!");
    }
}