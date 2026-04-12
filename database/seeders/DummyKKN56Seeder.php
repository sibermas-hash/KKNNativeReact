<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class DummyKKN56Seeder extends Seeder
{
    public function run(): void
    {
        if (!app()->environment('local', 'testing')) {
            $this->command->error('This seeder can only run in local or testing environment.');
            return;
        }

        // ═══════════════════════════════════════════════════
        // STEP 0: TOTAL CLEANUP
        // ═══════════════════════════════════════════════════
        DB::table('nilai_kkn')->delete();
        DB::table('kegiatan_kkn')->delete();
        DB::table('program_kerja')->delete();
        DB::table('peserta_kkn')->delete();
        DB::table('kelompok_kkn')->delete();
        // Hapus SEMUA periode (termasuk sampah faker)
        DB::table('periode')->delete();
        Cache::flush();

        // ═══════════════════════════════════════════════════
        // STEP 1: FAKULTAS
        // ═══════════════════════════════════════════════════
        $fakultasList = [
            ['id' => 1, 'nama' => 'Fakultas Tarbiyah dan Ilmu Keguruan', 'code' => 'FTIK'],
            ['id' => 2, 'nama' => 'Fakultas Ekonomi dan Bisnis Islam', 'code' => 'FEBI'],
            ['id' => 3, 'nama' => 'Fakultas Ushuluddin, Adab dan Humaniora', 'code' => 'FUH'],
            ['id' => 4, 'nama' => 'Fakultas Syariah', 'code' => 'FASYA'],
            ['id' => 5, 'nama' => 'Fakultas Dakwah', 'code' => 'FDK'],
        ];
        foreach ($fakultasList as $f) {
            DB::table('fakultas')->updateOrInsert(['id' => $f['id']], [
                'nama' => $f['nama'], 'code' => $f['code'],
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        // ═══════════════════════════════════════════════════
        // STEP 2: TAHUN AKADEMIK
        // ═══════════════════════════════════════════════════
        $ta = DB::table('tahun_akademik')->where('year', '2024/2025')->first();
        $taId = $ta ? $ta->id : DB::table('tahun_akademik')->insertGetId([
            'year' => '2024/2025', 'is_active' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        // ═══════════════════════════════════════════════════
        // STEP 3: PERIODE — RAW INSERT (bypass Eloquent mutator)
        // Jenis harus UPPERCASE sesuai KknType enum values
        // program_type harus lowercase sesuai Periode constants
        // ═══════════════════════════════════════════════════
        $periods = [
            [
                'academic_year_id' => $taId, 'periode' => 56,
                'jenis' => 'REGULER', 'program_type' => 'reguler',
                'program_subtype' => null,
                'registration_mode' => 'open',
                'placement_mode' => 'automatic_after_approval',
                'name' => 'Periode 56 - KKN Reguler (Kebumen, Cilacap, Wonosobo)',
                'start_date' => '2025-07-12', 'end_date' => '2025-08-20',
                'registration_start' => '2025-05-10', 'registration_end' => '2025-06-20',
                'kuota' => 2000, 'is_active' => true, 'current_phase' => 'registration',
            ],
            [
                'academic_year_id' => $taId, 'periode' => 56,
                'jenis' => 'NUSANTARA', 'program_type' => 'nusantara',
                'program_subtype' => null,
                'registration_mode' => 'selective',
                'placement_mode' => 'manual_admin',
                'name' => 'Periode 56 - KKN Nusantara (Kalibawang, Kulonprogo)',
                'start_date' => '2025-07-12', 'end_date' => '2025-08-20',
                'registration_start' => '2025-05-15', 'registration_end' => '2025-06-15',
                'kuota' => 20, 'is_active' => false, 'current_phase' => 'upcoming',
            ],
            [
                'academic_year_id' => $taId, 'periode' => 56,
                'jenis' => 'INTERNASIONAL', 'program_type' => 'internasional_mandiri',
                'program_subtype' => null,
                'registration_mode' => 'selective',
                'placement_mode' => 'host_defined',
                'name' => 'Periode 56 - KKN Internasional (Malaysia & Thailand)',
                'start_date' => '2025-08-01', 'end_date' => '2025-08-30',
                'registration_start' => '2025-06-01', 'registration_end' => '2025-06-30',
                'kuota' => 50, 'is_active' => false, 'current_phase' => 'upcoming',
            ],
            [
                'academic_year_id' => $taId, 'periode' => 56,
                'jenis' => 'KOLABORASI_PTKIN', 'program_type' => 'kolaborasi_ptkin',
                'program_subtype' => null,
                'registration_mode' => 'selective',
                'placement_mode' => 'host_defined',
                'name' => 'Periode 56 - KKN Kolaborasi PTKIN (Pekalongan/Semarang)',
                'start_date' => '2025-07-12', 'end_date' => '2025-08-20',
                'registration_start' => '2025-05-20', 'registration_end' => '2025-06-20',
                'kuota' => 30, 'is_active' => false, 'current_phase' => 'upcoming',
            ],
            [
                'academic_year_id' => $taId, 'periode' => 56,
                'jenis' => 'KAMPUNG_ZAKAT', 'program_type' => 'tematik',
                'program_subtype' => 'kampung_zakat',
                'registration_mode' => 'proposal_based',
                'placement_mode' => 'proposal_defined',
                'name' => 'Periode 56 - KKN Tematik Kampung Zakat',
                'start_date' => '2025-07-15', 'end_date' => '2025-08-25',
                'registration_start' => '2025-06-01', 'registration_end' => '2025-06-30',
                'kuota' => 100, 'is_active' => false, 'current_phase' => 'upcoming',
            ],
            [
                'academic_year_id' => $taId, 'periode' => 56,
                'jenis' => 'DESA_KATANA', 'program_type' => 'tematik',
                'program_subtype' => 'desa_katana',
                'registration_mode' => 'proposal_based',
                'placement_mode' => 'proposal_defined',
                'name' => 'Periode 56 - KKN Tematik Desa Katana',
                'start_date' => '2025-07-15', 'end_date' => '2025-08-25',
                'registration_start' => '2025-06-01', 'registration_end' => '2025-06-30',
                'kuota' => 80, 'is_active' => false, 'current_phase' => 'upcoming',
            ],
        ];

        foreach ($periods as $p) {
            DB::table('periode')->insert(array_merge($p, [
                'created_at' => now(), 'updated_at' => now(),
            ]));
        }

        // ═══════════════════════════════════════════════════
        // STEP 4: LOKASI
        // ═══════════════════════════════════════════════════
        $locations = [
            ['village_name' => 'Desa Ayah', 'district_name' => 'Kec. Ayah', 'regency_name' => 'Kab. Kebumen'],
            ['village_name' => 'Desa Karanganyar', 'district_name' => 'Kec. Karanganyar', 'regency_name' => 'Kab. Kebumen'],
            ['village_name' => 'Desa Adipala', 'district_name' => 'Kec. Adipala', 'regency_name' => 'Kab. Cilacap'],
            ['village_name' => 'Desa Kalibawang', 'district_name' => 'Kec. Kalibawang', 'regency_name' => 'Kab. Kulonprogo'],
            ['village_name' => 'Songkhla', 'district_name' => 'South Thailand', 'regency_name' => 'Thailand'],
            ['village_name' => 'Pekalongan City', 'district_name' => 'Kec. Pekalongan', 'regency_name' => 'Kota Pekalongan'],
        ];
        foreach ($locations as $loc) {
            DB::table('lokasi')->updateOrInsert(
                ['village_name' => $loc['village_name']],
                array_merge($loc, ['created_at' => now(), 'updated_at' => now()])
            );
        }

        // ═══════════════════════════════════════════════════
        // STEP 5: DOSEN (DPL)
        // ═══════════════════════════════════════════════════
        for ($i = 1; $i <= 5; $i++) {
            $nip = "19800101202501100$i";
            $email = "dpl$i@uinsaizu.ac.id";
            $existing = DB::table('users')->where('username', $nip)->orWhere('email', $email)->first();
            if (!$existing) {
                $userId = DB::table('users')->insertGetId([
                    'username' => $nip, 'name' => "Dr. DPL Simulator $i, M.Ag",
                    'email' => $email, 'password' => Hash::make(env('KKN_LOCAL_SEED_PASSWORD', Str::random(32))),
                    'email_verified_at' => now(), 'created_at' => now(), 'updated_at' => now(),
                ]);
            } else {
                $userId = $existing->id;
                DB::table('users')->where('id', $userId)->update(['username' => $nip]);
            }
            DB::table('dosen')->updateOrInsert(['user_id' => $userId], [
                'nip' => $nip, 'nama' => "Dr. DPL Simulator $i, M.Ag",
                'faculty_id' => ($i % 5) + 1,
                'created_at' => now(), 'updated_at' => now(),
            ]);
            DB::table('model_has_roles')->updateOrInsert(
                ['model_id' => $userId, 'model_type' => 'App\Models\User'], ['role_id' => 2]
            );
        }

        // ═══════════════════════════════════════════════════
        // STEP 6: MAHASISWA (50 orang)
        // ═══════════════════════════════════════════════════
        for ($i = 1; $i <= 50; $i++) {
            $nim = '21' . '174090' . str_pad($i, 3, '0', STR_PAD_LEFT);
            $email = "student$i@mhs.uinsaizu.ac.id";
            $existing = DB::table('users')->where('username', $nim)->orWhere('email', $email)->first();
            if (!$existing) {
                $userId = DB::table('users')->insertGetId([
                    'username' => $nim, 'name' => "Mahasiswa Dummy $i",
                    'email' => $email,
                    'password' => Hash::make(env('KKN_LOCAL_SEED_PASSWORD', Str::random(32))),
                    'email_verified_at' => now(), 'created_at' => now(), 'updated_at' => now(),
                ]);
            } else {
                $userId = $existing->id;
                DB::table('users')->where('id', $userId)->update(['username' => $nim]);
            }
            DB::table('mahasiswa')->updateOrInsert(['user_id' => $userId], [
                'nim' => $nim, 'nama' => "Mahasiswa Dummy $i",
                'faculty_id' => ($i % 5) + 1, 'batch_year' => 2021,
                'sks_completed' => rand(100, 140),
                'gpa' => number_format(rand(300, 400) / 100, 2),
                'gender' => $i % 2 == 0 ? 'L' : 'P',
                'university' => 'UIN Prof. K.H. Saifuddin Zuhri Purwokerto',
                'is_bta_ppi_passed' => true, 'status_bta_ppi' => 'LULUS',
                'semester' => 7, 'created_at' => now(), 'updated_at' => now(),
            ]);
            DB::table('model_has_roles')->updateOrInsert(
                ['model_id' => $userId, 'model_type' => 'App\Models\User'], ['role_id' => 3]
            );
        }

        // ═══════════════════════════════════════════════════
        // FINAL: FLUSH ALL CACHE
        // ═══════════════════════════════════════════════════
        Cache::flush();
    }
}
