<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\Prodi;
use App\Models\KKN\TahunAkademik;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ImportKknExcel extends Command
{
    protected $signature = 'kkn:import-excel {path} {--dry-run}';

    protected $description = 'Clear existing KKN data and import from Excel file';

    public function handle()
    {
        $path = $this->argument('path');

        if (! file_exists($path)) {
            $this->error("File not found: {$path}");

            return 1;
        }

        $this->info('Starting KKN data import...');

        if (! $this->option('dry-run')) {
            $this->clearData();
        } else {
            $this->info('Dry run: Skipping data clearing.');
        }

        try {
            $spreadsheet = IOFactory::load($path);
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();

            // Remove header row
            $header = array_shift($rows);

            $this->info('Found '.count($rows).' rows in Excel.');

            $bar = $this->output->createProgressBar(count($rows));
            $bar->start();

            $period = Periode::where('is_active', true)->first();
            if (! $period) {
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
                // Check if row has numeric No
                if (!isset($row[0]) || !is_numeric($row[0])) {
                    continue;
                }

                $nim = (string) $row[1];
                if (empty($nim)) {
                    continue;
                }
                
                $nama = $row[2];
                $gender = ($row[3] === 'P') ? 'P' : 'L';
                $facultyName = $row[4];
                $programCode = $row[5];
                $phone = $row[8];

                // 1. Faculty & Program
                $facultyName = trim($facultyName);
                $programCode = trim($programCode);
                
                $facultyCode = strtoupper(substr($facultyName, 0, 4));
                // Try finding by name first, then by code
                $faculty = Fakultas::where('nama', $facultyName)->first() 
                    ?? Fakultas::where('code', $facultyCode)->first();
                
                if (!$faculty) {
                    $faculty = Fakultas::create(['nama' => $facultyName, 'code' => $facultyCode]);
                }

                $program = Prodi::where('code', $programCode)->first();
                if (!$program) {
                    $program = Prodi::create([
                        'code' => $programCode, 
                        'nama' => $programCode, 
                        'fakultas_id' => $faculty->id
                    ]);
                }

                // 2. User & Mahasiswa
                $user = User::updateOrCreate(
                    ['username' => $nim],
                    [
                        'name' => $nama,
                        'email' => $nim.'@student.uinsaizu.ac.id',
                        'password' => Hash::make('Password#123'),
                        'phone' => $phone,
                    ]
                );

                if (! $user->hasRole('student')) {
                    $user->assignRole('student');
                }

                $mahasiswa = Mahasiswa::updateOrCreate(
                    ['nim' => $nim],
                    [
                        'user_id' => $user->id,
                        'nama' => $nama,
                        'fakultas_id' => $faculty->id,
                        'prodi_id' => $program->id,
                        'gender' => $gender,
                        'batch_year' => 2022,
                    ]
                );

                // 3. Registration (Peserta KKN)
                PesertaKkn::updateOrCreate(
                    ['mahasiswa_id' => $mahasiswa->id, 'periode_id' => $period->id],
                    [
                        'kelompok_id' => null, // No group assigned yet
                        'status' => 'approved',
                        'registration_date' => now(),
                    ]
                );

                $bar->advance();
            }

            $bar->finish();
            $this->newLine();
            $this->info('Import completed successfully.');

        } catch (\Exception $e) {
            $this->error('Error: '.$e->getMessage());

            return 1;
        }

        return 0;
    }

    protected function clearData()
    {
        $this->warn('Clearing existing data...');

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

        // Delete users except those with admin roles
        User::whereDoesntHave('roles', function($q) {
            $q->whereIn('name', ['superadmin', 'admin', 'faculty_admin']);
        })->delete();

        $this->info('Database cleared.');
    }
}
