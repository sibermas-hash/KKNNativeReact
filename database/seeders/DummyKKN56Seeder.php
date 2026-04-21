<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class DummyKKN56Seeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Starting DummyKKN56Seeder...');
        $this->seedData();
        $this->command->info('DummyKKN56Seeder done at ' . date('H:i:s'));
    }

    private function seedData(): void
    {
        $this->command->info('seedData running');

        // Academic Year - use existing or create
        $ta = DB::table('tahun_akademik')->where('year', '2024/2025')->first();
        $taId = $ta ? $ta->id : DB::table('tahun_akademik')->insertGetId([
            'year' => '2024/2025', 'is_active' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->command->info('TA ID: ' . $taId);

        // Periode - use existing or create
        $periode = DB::table('periode')->where('name', 'KKN Reguler 56')->first();
        $periodeId = $periode ? $periode->id : DB::table('periode')->insertGetId([
            'academic_year_id' => $taId,
            'periode' => 56,
            'jenis' => 'REGULER',
            'program_type' => 'reguler',
            'name' => 'KKN Reguler 56',
            'start_date' => '2025-07-12',
            'end_date' => '2025-08-20',
            'registration_start' => '2025-05-01',
            'registration_end' => '2025-06-15',
            'registration_mode' => 'open',
            'placement_mode' => 'automatic_after_approval',
            'kuota' => 500,
            'is_active' => true,
            'current_phase' => 'registration',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->command->info('Periode ID: ' . $periodeId);

        // Insert fakultas if none exist
        $existingFak = DB::table('fakultas')->count();
        $this->command->info('Existing fakultas: ' . $existingFak);
        if ($existingFak === 0) {
            $fakList = [
                ['nama' => 'Fakultas Tarbiyah dan Ilmu Keguruan', 'code' => 'FTIK'],
                ['nama' => 'Fakultas Ekonomi dan Bisnis Islam', 'code' => 'FEBI'],
            ];
            foreach ($fakList as $idx => $f) {
                DB::table('fakultas')->insertGetId(array_merge($f, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }
        }
        $this->command->info('Fakultas now: ' . DB::table('fakultas')->count());

        // Insert prodi if not exist
        $existingProdi = DB::table('prodi')->count();
        if ($existingProdi === 0) {
            foreach ([
                ['id' => 1, 'fakultas_id' => 1, 'nama' => 'PAI', 'code' => 'PAI'],
                ['id' => 2, 'fakultas_id' => 1, 'nama' => 'PBA', 'code' => 'PBA'],
                ['id' => 3, 'fakultas_id' => 2, 'nama' => 'Ekonomi Syariah', 'code' => 'ES'],
            ] as $p) {
                DB::table('prodi')->insert(array_merge($p, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }
        }
        $this->command->info('Prodi: ' . DB::table('prodi')->count());

        $this->command->info('DONE at ' . date('H:i:s'));

        // ═══════════════════════════════════════════════════
        // STEP 0: TOTAL CLEANUP
        // ═══════════════════════════════════════════════════
        $this->command->info('Cleaning up tables...');
        DB::table('nilai_kkn')->delete();
        DB::table('kegiatan_kkn')->delete();
        DB::table('program_kerja')->delete();
        DB::table('peserta_kkn')->delete();
        DB::table('kelompok_kkn')->delete();
        DB::table('periode')->delete();
        Cache::flush();
        $this->command->info('Cleanup done. inserting periode...');

        // ═══════════════════════════════════════════════════
        // STEP 3: PERIODE
        // ═══════════════════════════════════════════════════
        $ta = DB::table('tahun_akademik')->where('year', '2024/2025')->first();
        $taId = $ta ? $ta->id : DB::table('tahun_akademik')->insertGetId([
            'year' => '2024/2025', 'is_active' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->command->info('Academic year ID: ' . $taId);

        $periods = [
            [
                'academic_year_id' => $taId, 'periode' => 56,
                'jenis' => 'REGULER', 'program_type' => 'reguler',
                'name' => 'KKN Reguler',
                'start_date' => '2025-07-12', 'end_date' => '2025-08-20',
                'registration_start' => '2025-05-01', 'registration_end' => '2025-06-15',
                'registration_mode' => 'open',
                'placement_mode' => 'automatic_after_approval',
                'kuota' => 500, 'is_active' => true, 'current_phase' => 'registration',
            ],
        ];

        foreach ($periods as $p) {
            DB::table('periode')->insert(array_merge($p, [
                'created_at' => now(), 'updated_at' => now(),
            ]));
            $this->command->info('Inserted periode: ' . $p['name']);
        }
        $this->command->info('Periode count: ' . DB::table('periode')->count());
        $this->command->info('Inserting fakultas...');

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
        $this->command->info('Fakultas count: ' . DB::table('fakultas')->count());
        $this->command->info('Creating prodi...');

        // ═══════════════════════════════════════════════════
        // STEP 1.5: PRODI
        // ═══════════════════════════════════════════════════
        $prodiList = [
            ['id' => 1, 'fakultas_id' => 1, 'nama' => 'Pendidikan Agama Islam', 'code' => 'PAI'],
            ['id' => 2, 'fakultas_id' => 1, 'nama' => 'Pendidikan Bahasa Arab', 'code' => 'PBA'],
            ['id' => 3, 'fakultas_id' => 2, 'nama' => 'Ekonomi Syariah', 'code' => 'ES'],
            ['id' => 4, 'fakultas_id' => 4, 'nama' => 'Hukum Keluarga Islam', 'code' => 'HKI'],
            ['id' => 5, 'fakultas_id' => 5, 'nama' => 'Komunikasi Penyiaran Islam', 'code' => 'KPI'],
        ];
        foreach ($prodiList as $p) {
            DB::table('prodi')->updateOrInsert(['id' => $p['id']], [
                'fakultas_id' => $p['fakultas_id'],
                'nama' => $p['nama'], 'code' => $p['code'],
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
            if (! $existing) {
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
                'fakultas_id' => ($i % 5) + 1,
                'created_at' => now(), 'updated_at' => now(),
            ]);
            $dplUser = User::find($userId);
            $dosenRole = Role::firstOrCreate(['name' => 'dosen', 'guard_name' => 'web']);
            $dplUser->assignRole($dosenRole);
        }

        // ═══════════════════════════════════════════════════
        // STEP 6: MAHASISWA (50 orang)
        // ═══════════════════════════════════════════════════
        for ($i = 1; $i <= 50; $i++) {
            $nim = '21'.'174090'.str_pad($i, 3, '0', STR_PAD_LEFT);
            $email = "student$i@mhs.uinsaizu.ac.id";
            $existing = DB::table('users')->where('username', $nim)->orWhere('email', $email)->first();
            if (! $existing) {
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
                'fakultas_id' => ($i % 5) + 1,
                'prodi_id' => ($i % 5) + 1,
                'batch_year' => 2021,
                'sks_completed' => rand(100, 140),
                'gpa' => number_format(rand(300, 400) / 100, 2),
                'gender' => $i % 2 == 0 ? 'L' : 'P',
                'university' => 'UIN Prof. K.H. Saifuddin Zuhri Purwokerto',
                'status_bta_ppi' => 'LULUS',
                'semester' => 7,
                'health_certificate_path' => 'dummy/health_'.$i.'.pdf',
                'parent_permission_path' => 'dummy/parent_'.$i.'.pdf',
                'nik' => '330101'.str_pad((string) $i, 10, '0', STR_PAD_LEFT),
                'mother_name' => 'Ibu Mandatori '.$i,
                'birth_place' => 'Purwokerto',
                'birth_date' => '2003-01-01',
                'created_at' => now(), 'updated_at' => now(),
            ]);
            $studentUser = User::find($userId);
            $studentRole = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
            $studentUser->assignRole($studentRole);

            // ═══════════════════════════════════════════════════
            // STEP 7: PESERTA KKN (REGISTRATIONS)
            // ═══════════════════════════════════════════════════
            if ($i <= 40) { // Seed 40 registrations
                DB::table('peserta_kkn')->insert([
                    'mahasiswa_id' => $userId, // User ID is used as Mahasiswa ID if using updateOrInsert above incorrectly, wait...
                    // In this seeder, Mahasiswa table is linked via user_id, but the PK might be different.
                    // Let's check Mahasiswa table PK.
                    'mahasiswa_id' => DB::table('mahasiswa')->where('user_id', $userId)->value('id'),
                    'periode_id' => $periods[0]['academic_year_id'], // This is wrong, should be period ID
                    'periode_id' => DB::table('periode')->where('name', $periods[0]['name'])->value('id'),
                    'registration_date' => now()->subDays(rand(1, 10)),
                    'status' => $i <= 10 ? 'pending' : ($i <= 30 ? 'approved' : 'rejected'),
                    'created_at' => now(), 'updated_at' => now(),
                ]);
            }
        }

        // ═══════════════════════════════════════════════════
        // FINAL: FLUSH ALL CACHE
        // ═══════════════════════════════════════════════════
        Cache::flush();
    }
}
