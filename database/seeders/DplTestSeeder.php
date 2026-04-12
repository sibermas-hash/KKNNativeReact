<?php

namespace Database\Seeders;

use App\Enums\KknType;
use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Periode;
use App\Models\KKN\Prodi;
use App\Models\KKN\TahunAkademik;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DplTestSeeder extends Seeder
{
    /**
     * Seed test data for DPL assignment page.
     */
    public function run(): void
    {
        if (!app()->environment('local', 'testing')) {
            $this->command->error('This seeder can only run in local or testing environment.');
            return;
        }

        $this->command->info('🌱 Seeding DPL test data...');

        // 1. Create Tahun Akademik
        $this->command->info('📅 Creating Tahun Akademik...');
        $tahunAkademik = TahunAkademik::firstOrCreate(
            ['year' => '2025/2026'],
            ['is_active' => true]
        );

        // 2. Create Fakultas
        $this->command->info('🏛️ Creating Fakultas...');
        $fakultasData = [
            ['code' => 'FTIK', 'nama' => 'Fakultas Tarbiyah dan Ilmu Keguruan'],
            ['code' => 'FEB', 'nama' => 'Fakultas Ekonomi dan Bisnis'],
            ['code' => 'FSH', 'nama' => 'Fakultas Syariah dan Hukum'],
        ];

        $fakultasMap = [];
        foreach ($fakultasData as $fData) {
            $fakultas = Fakultas::firstOrCreate(['code' => $fData['code']], $fData);
            $fakultasMap[$fData['code']] = $fakultas->id;
        }

        // 3. Create Program Studi
        $this->command->info('📚 Creating Program Studi...');
        $prodiData = [
            ['code' => 'PEND-MTK', 'nama' => 'Pendidikan Matematika', 'faculty_code' => 'FTIK'],
            ['code' => 'PEND-BSI', 'nama' => 'Pendidikan Bahasa Inggris', 'faculty_code' => 'FTIK'],
            ['code' => 'EKONOMI', 'nama' => 'Ekonomi Syariah', 'faculty_code' => 'FEB'],
            ['code' => 'HUKUM', 'nama' => 'Hukum Keluarga', 'faculty_code' => 'FSH'],
        ];

        $prodiMap = [];
        foreach ($prodiData as $pData) {
            $prodi = Prodi::firstOrCreate(
                ['code' => $pData['code']],
                [
                    'nama' => $pData['nama'],
                    'faculty_id' => $fakultasMap[$pData['faculty_code']],
                ]
            );
            $prodiMap[$pData['code']] = $prodi->id;
        }

        // 4. Create Lokasi (Kecamatan)
        $this->command->info('📍 Creating Lokasi...');
        $lokasiData = [
            ['village_name' => 'Karangmangu', 'district_name' => 'Banyumas', 'regency_name' => 'Banyumas', 'district_id' => '3302010'],
            ['village_name' => 'Ajibarang', 'district_name' => 'Ajibarang', 'regency_name' => 'Banyumas', 'district_id' => '3302020'],
            ['village_name' => 'Purwokerto', 'district_name' => 'Purwokerto Timur', 'regency_name' => 'Banyumas', 'district_id' => '3302030'],
        ];

        $lokasiMap = [];
        foreach ($lokasiData as $lData) {
            $lokasi = Lokasi::firstOrCreate(
                ['district_name' => $lData['district_name'], 'regency_name' => $lData['regency_name']],
                $lData
            );
            $lokasiMap[$lData['district_name']] = $lokasi->id;
        }

        // 5. Create Periode KKN Aktif
        $this->command->info('📋 Creating Periode KKN Aktif...');
        $periode = Periode::firstOrCreate(
            ['name' => 'KKN Periode 58 - 2025/2026'],
            [
                'academic_year_id' => $tahunAkademik->id,
                'periode' => 58,
                'jenis' => KknType::REGULER,
                'program_type' => Periode::PROGRAM_TYPE_REGULER,
                'start_date' => now()->addDays(7),
                'end_date' => now()->addDays(67),
                'registration_start' => now()->subDays(14),
                'registration_end' => now()->addDays(14),
                'kuota' => 1000,
                'is_active' => true,
            ]
        );

        // 6. Create Dosen (DPL)
        $this->command->info('👨‍🏫 Creating Dosen...');
        $dosenData = [
            ['nip' => '198001012005011001', 'nama' => 'Dr. Ahmad Fauzi, M.Pd', 'faculty_id' => $fakultasMap['FTIK']],
            ['nip' => '198502022006041002', 'nama' => 'Siti Nurhaliza, M.Pd', 'faculty_id' => $fakultasMap['FTIK']],
            ['nip' => '199003032007011003', 'nama' => 'Budi Santoso, M.E.I', 'faculty_id' => $fakultasMap['FEB']],
            ['nip' => '199104042008012004', 'nama' => 'Dewi Lestari, M.H.I', 'faculty_id' => $fakultasMap['FSH']],
            ['nip' => '198805052009011005', 'nama' => 'Rudi Hermawan, M.Pd', 'faculty_id' => $fakultasMap['FTIK']],
        ];

        $dosenMap = [];
        foreach ($dosenData as $dData) {
            $dosen = Dosen::firstOrCreate(
                ['nip' => $dData['nip']],
                [
                    'nama' => $dData['nama'],
                    'faculty_id' => $dData['faculty_id'],
                    'master_synced_at' => now(),
                ]
            );

            // Create user account for each dosen
            $username = $dData['nip'];
            $user = User::firstOrCreate(
                ['username' => $username],
                [
                    'name' => $dData['nama'],
                    'email' => Str::slug($dData['nama']) . '@uinsaizu.ac.id',
                    'password' => Hash::make(env('KKN_LOCAL_SEED_PASSWORD', Str::random(32))),
                    'is_active' => true,
                    'faculty_id' => $dData['faculty_id'],
                ]
            );

            $user->assignRole('dpl');

            $dosenMap[$dData['nip']] = $dosen->id;
        }

        // 7. Create Kelompok KKN
        $this->command->info('👥 Creating Kelompok KKN...');
        $kelompokData = [
            ['code' => 'KKN-58-001', 'nama' => 'Kelompok 001', 'district' => 'Banyumas', 'capacity' => 10],
            ['code' => 'KKN-58-002', 'nama' => 'Kelompok 002', 'district' => 'Banyumas', 'capacity' => 10],
            ['code' => 'KKN-58-003', 'nama' => 'Kelompok 003', 'district' => 'Ajibarang', 'capacity' => 8],
            ['code' => 'KKN-58-004', 'nama' => 'Kelompok 004', 'district' => 'Ajibarang', 'capacity' => 8],
            ['code' => 'KKN-58-005', 'nama' => 'Kelompok 005', 'district' => 'Purwokerto Timur', 'capacity' => 12],
        ];

        foreach ($kelompokData as $kData) {
            KelompokKkn::firstOrCreate(
                ['code' => $kData['code']],
                [
                    'nama_kelompok' => $kData['nama'],
                    'period_id' => $periode->id,
                    'location_id' => $lokasiMap[$kData['district']],
                    'dpl_id' => null,
                    'dpl_period_id' => null,
                    'capacity' => $kData['capacity'],
                    'status' => 'draft',
                    'token' => strtoupper(Str::random(8)),
                ]
            );
        }

        $this->command->info('');
        $this->command->info('✅ DPL test data seeding completed!');
        $this->command->info('');
        $this->command->info('📊 Summary:');
        $this->command->info('   📅 Tahun Akademik: 2025/2026');
        $this->command->info('   🏛️  Fakultas: ' . count($fakultasData));
        $this->command->info('   📚 Program Studi: ' . count($prodiData));
        $this->command->info('   📍 Lokasi: ' . count($lokasiData));
        $this->command->info('   📋 Periode: ' . $periode->name . ' (Aktif)');
        $this->command->info('   👨‍🏫 Dosen: ' . count($dosenData));
        $this->command->info('   👥 Kelompok: ' . count($kelompokData));
        $this->command->info('');
        $this->command->info('🔐 Dosen Login Info:');
        $this->command->info('   Username: [NIP dosen]');
        $this->command->info('   Password: password123');
        $this->command->info('');
        $this->command->info('🌐 Test URL: http://localhost:8000/admin/dpl/penugasan');
    }
}
