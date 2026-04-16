<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FullLifecycleSimulationSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local', 'testing')) {
            $this->command->error('This seeder can only run in local or testing environment.');

            return;
        }

        // 1. Ambil Periode 56 & Lokasi & DPL
        $periode = DB::table('periode')->where('periode', 56)->where('jenis', 'REGULER')->first();
        if (! $periode) {
            $this->command->error('Periode 56 REGULER tidak ditemukan.');

            return;
        }

        $locations = DB::table('lokasi')->limit(3)->get();
        $dosens = DB::table('dosen')->limit(3)->get();
        $mahasiswas = DB::table('mahasiswa')->limit(30)->get();

        if ($locations->count() < 3 || $dosens->count() < 3 || $mahasiswas->count() < 30) {
            return;
        }

        // Cleanup previous simulation data to avoid unique violations
        DB::table('nilai_kkn')->whereIn('kelompok_id', function ($query) use ($periode) {
            $query->select('id')->from('kelompok_kkn')->where('period_id', $periode->id)->where('code', 'like', 'K56-%');
        })->delete();

        DB::table('kegiatan_kkn')->whereIn('kelompok_id', function ($query) use ($periode) {
            $query->select('id')->from('kelompok_kkn')->where('period_id', $periode->id)->where('code', 'like', 'K56-%');
        })->delete();

        DB::table('program_kerja')->whereIn('kelompok_id', function ($query) use ($periode) {
            $query->select('id')->from('kelompok_kkn')->where('period_id', $periode->id)->where('code', 'like', 'K56-%');
        })->delete();

        DB::table('peserta_kkn')->where('period_id', $periode->id)->delete();
        DB::table('kelompok_kkn')->where('period_id', $periode->id)->where('code', 'like', 'K56-%')->delete();

        // 2. Buat 3 Kelompok
        $kelompokIds = [];
        foreach ($locations as $index => $loc) {
            $kelompokIds[] = DB::table('kelompok_kkn')->insertGetId([
                'period_id' => $periode->id,
                'location_id' => $loc->id,
                'dpl_id' => $dosens[$index]->id,
                'code' => 'K56-0'.($index + 1),
                'nama_kelompok' => 'Kelompok 0'.($index + 1).' - '.$loc->village_name,
                'capacity' => 10,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 3. Masukkan Mahasiswa ke Kelompok (Plotting)
        foreach ($mahasiswas as $index => $mhs) {
            $kelompokIndex = intval($index / 10);
            $kelompokId = $kelompokIds[$kelompokIndex];

            DB::table('peserta_kkn')->insert([
                'mahasiswa_id' => $mhs->id,
                'period_id' => $periode->id,
                'kelompok_id' => $kelompokId,
                'status' => 'approved',
                'registration_date' => Carbon::now()->subDays(10),
                'approved_at' => Carbon::now()->subDays(9),
                'joined_group_at' => Carbon::now()->subDays(9),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 4. Generate Log Harian (Aktivitas) - 3 Per Mahasiswa
            for ($days = 1; $days <= 3; $days++) {
                DB::table('kegiatan_kkn')->insert([
                    'mahasiswa_id' => $mhs->id,
                    'kelompok_id' => $kelompokId,
                    'date' => Carbon::now()->subDays(4 - $days)->toDateString(),
                    'title' => "Kegiatan Hari ke-$days di ".$locations[$kelompokIndex]->village_name,
                    'activity' => 'Melakukan observasi dan koordinasi dengan perangkat desa terkait program '.($days == 1 ? 'Pendidikan' : 'Kesehatan'),
                    'status' => $days == 1 ? 'approved' : 'submitted',
                    'abcd_stage' => 'discovery',
                    'location_name' => $locations[$kelompokIndex]->village_name,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // 5. Masukkan Nilai Simulasi (Hanya untuk 10 mahasiswa pertama)
            if ($index < 10) {
                DB::table('nilai_kkn')->insert([
                    'user_id' => $mhs->user_id,
                    'kelompok_id' => $kelompokId,
                    'execution_score' => rand(80, 95),
                    'article_score' => rand(75, 90),
                    'discipline_score' => rand(85, 100),
                    'attitude_score' => rand(90, 100),
                    'total_score' => rand(82, 94),
                    'letter_grade' => 'A',
                    'is_finalized' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // 6. Buat Program Kerja (Proker) - 2 Per Kelompok
        foreach ($kelompokIds as $kId) {
            DB::table('program_kerja')->insert([
                'kelompok_id' => $kId,
                'title' => 'Digitalisasi Administrasi Desa',
                'description' => 'Membantu perangkat desa dalam mengelola data penduduk secara digital.',
                'status' => 'approved',
                'abcd_stage' => 'design',
                'sdg_goals' => json_encode([4, 9]),
                'kategori' => 'Pendidikan/Teknologi',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('program_kerja')->insert([
                'kelompok_id' => $kId,
                'title' => 'Edukasi Stunting & Sanitasi',
                'description' => 'Sosialisasi pencegahan stunting bagi ibu hamil dan balita.',
                'status' => 'submitted',
                'abcd_stage' => 'discovery',
                'sdg_goals' => json_encode([3]),
                'kategori' => 'Kesehatan',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
