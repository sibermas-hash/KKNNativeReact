<?php

namespace App\Console\Commands;

use App\Models\KKN\TahunAkademik;
use App\Models\KKN\Fakultas;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Dosen;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Periode;
use App\Models\KKN\Prodi;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ImportKknExcel extends Command
{
    protected $signature = 'kkn:import-excel {path} {--dry-run}';
    protected $description = 'Clear existing KKN data and import from Excel file';

    public function handle()
    {
        $path = $this->argument('path');

        if (!file_exists($path)) {
            $this->error("File not found: {$path}");
            return 1;
        }

        $this->info("Starting KKN data import...");

        if (!$this->option('dry-run')) {
            $this->clearData();
        } else {
            $this->info("Dry run: Skipping data clearing.");
        }

        try {
            $spreadsheet = IOFactory::load($path);
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();
            
            // Remove header row
            $header = array_shift($rows);
            
            $this->info("Found " . count($rows) . " rows in Excel.");
            
            $bar = $this->output->createProgressBar(count($rows));
            $bar->start();

            $period = Periode::where('is_active', true)->first();
            if (!$period) {
                $academicYear = TahunAkademik::firstOrCreate(
                    ['year' => '2024/2025'],
                    ['is_active' => true]
                );

                $period = Periode::create([
                    'academic_year_id' => $academicYear->id,
                    'name' => 'KKN Angkatan 57',
                    'start_date' => now(),
                    'end_date' => now()->addMonths(2),
                    'registration_start' => now()->subMonth(),
                    'registration_end' => now(),
                    'is_active' => true,
                ]);
                $this->warn("\nNo active period found. Created default: {$period->name}");
            }

            foreach ($rows as $row) {
                if (empty($row[6])) continue; // Skip if NIM is empty

                $kelompokCode = $row[1];
                $desa = $row[2];
                $kecamatan = $row[3];
                $kabupaten = $row[4];
                $nama = $row[5];
                $nim = $row[6];
                $gender = ($row[7] === 'P') ? 'P' : 'L';
                $phone = $row[8];
                $dplName = $row[9];
                $pt = $row[10] ?? 'UIN SAIZU';

                // 1. Faculty & Program (Defaults)
                $faculty = Fakultas::firstOrCreate(['code' => 'FTIK'], ['nama' => 'Fakultas Tarbiyah dan Ilmu Keguruan']);
                $program = Prodi::firstOrCreate(
                    ['code' => 'PBA'], 
                    ['nama' => 'Pendidikan Bahasa Arab', 'faculty_id' => $faculty->id]
                );

                // 2. Location
                $location = Lokasi::firstOrCreate(
                    ['village_name' => $desa],
                    [
                        'address' => "{$kecamatan}, {$kabupaten}",
                        'capacity' => 20
                    ]
                );

                // 3. Lecturer (DPL)
                $nip = substr('dpl_' . str_replace([' ', "'"], ['_', ''], strtolower($dplName)), 0, 20);
                $lecturerUser = User::firstOrCreate(
                    ['username' => $nip],
                    [
                        'name' => $dplName,
                        'email' => str_replace([' ', "'"], ['.', ''], strtolower($dplName)) . '@uinsaizu.ac.id',
                        'password' => Hash::make(\Illuminate\Support\Str::password(12)),
                    ]
                );
                
                if (!$lecturerUser->hasRole('dpl')) {
                    $lecturerUser->assignRole('dpl');
                }

                $lecturer = Dosen::firstOrCreate(
                    ['nama' => $dplName],
                    [
                        'user_id' => $lecturerUser->id,
                        'nip' => $lecturerUser->username,
                        'faculty_id' => $faculty->id,
                    ]
                );

                // 4. Group
                $group = KelompokKkn::firstOrCreate(
                    ['code' => 'K' . $kelompokCode],
                    [
                        'period_id' => $period->id,
                        'location_id' => $location->id,
                        'dpl_id' => $lecturer->id,
                        'nama_kelompok' => "Kelompok {$kelompokCode}",
                        'capacity' => 15,
                        'status' => 'active'
                    ]
                );

                // 5. User & Mahasiswa
                $user = User::updateOrCreate(
                    ['username' => $nim],
                    [
                        'name' => $nama,
                        'email' => $nim . '@student.uinsaizu.ac.id',
                        'password' => Hash::make(\Illuminate\Support\Str::password(12)),
                        'phone' => $phone,
                    ]
                );
                
                if (!$user->hasRole('student')) {
                    $user->assignRole('student');
                }

                $mahasiswa = Mahasiswa::updateOrCreate(
                    ['nim' => $nim],
                    [
                        'user_id' => $user->id,
                        'nama' => $nama,
                        'faculty_id' => $faculty->id,
                        'program_id' => $program->id,
                        'gender' => $gender,
                        'batch_year' => 2022,
                    ]
                );

                // 6. Registration (Peserta KKN)
                PesertaKkn::updateOrCreate(
                    ['mahasiswa_id' => $mahasiswa->id, 'period_id' => $period->id],
                    [
                        'kelompok_id' => $group->id,
                        'status' => 'approved',
                        'registration_date' => now(),
                    ]
                );

                DB::table('group_members')->updateOrInsert(
                    ['kelompok_id' => $group->id, 'mahasiswa_id' => $mahasiswa->id],
                    ['joined_at' => now()]
                );

                $bar->advance();
            }

            $bar->finish();
            $this->newLine();
            $this->info("Import completed successfully.");

        } catch (\Exception $e) {
            $this->error("Error: " . $e->getMessage());
            return 1;
        }

        return 0;
    }

    protected function clearData()
    {
        $this->warn("Clearing existing data...");

        // Disable foreign key checks
        DB::statement('SET CONSTRAINTS ALL DEFERRED'); 

        // Tables to truncate (Indonesian names)
        $tables = [
            'evaluasi',
            'item_evaluasi',
            'nilai_kkn',
            'laporan_akhir',
            'program_kerja',
            'kegiatan_kkn',
            'file_kegiatan_kkn',
            'dokumen_peserta_kkn',
            'peserta_kkn',
            'group_members',
            'kelompok_kkn',
            'lokasi',
            'mahasiswa',
            'dosen',
        ];

        foreach ($tables as $table) {
            DB::table($table)->truncate();
        }

        // Delete users except superadmin
        User::where('email', '!=', 'superadmin@uinsaizu.ac.id')->delete();

        $this->info("Database cleared.");
    }
}
