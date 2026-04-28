<?php

namespace Database\Seeders;

use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\Prodi;
use App\Models\KKN\TahunAkademik;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class RestoreFromBackupSeeder extends Seeder
{
    public function run(): void
    {
        DB::beginTransaction();
        try {
            // Cleanup orphaned data first to ensure integrity
            Dosen::whereDoesntHave('user')->delete();
            Mahasiswa::whereDoesntHave('user')->delete();

            $this->importDosen();

            $this->importStudents();
            DB::commit();
            $this->command->info('Restorasi selesai dengan sukses!');
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Restorasi gagal: '.$e->getMessage());
        }
    }

    private function importDosen()
    {
        $path = base_path('storage/DOC DB/dosen_backup_470.csv');
        if (! file_exists($path)) {
            $this->command->error('File Dosen CSV tidak ditemukan di: '.$path);

            return;
        }

        $handle = fopen($path, 'r');
        $header = fgetcsv($handle); // Skip header

        $count = 0;
        while (($data = fgetcsv($handle)) !== false) {
            if (count($data) < 8) {
                continue;
            }

            $row = [
                'ID' => $data[0],
                'NIP' => $data[1],
                'Nama' => $data[2],
                'Email' => $data[3],
                'Telepon' => $data[4],
                'Jenis_Kelamin' => $data[5],
                'Golongan' => $data[6],
                'Unit_Kerja' => $data[7],
            ];

            $count++;
            echo 'Importing Dosen: '.$count."\r";

            $user = User::updateOrCreate(
                ['username' => $row['NIP']],
                [
                    'name' => $row['Nama'],
                    'email' => $row['Email'] ?: ($row['NIP'].'@kkn.uinsaizu.ac.id'),
                    'password' => Hash::make(env('KKN_LOCAL_SEED_PASSWORD', 'password')),
                    'password_changed_at' => null,
                    'must_change_password' => true,
                    'phone' => $row['Telepon'] ?: null,
                    'is_active' => true,
                ]
            );

            $user->assignRole('dosen');

            $fakultas = Fakultas::firstOrCreate(
                ['nama' => $row['Unit_Kerja'] ?: 'Lainnya'],
                ['code' => strtoupper(substr($row['Unit_Kerja'] ?: 'LN', 0, 10))]
            );

            Dosen::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'nip' => $row['NIP'],
                    'nama' => $row['Nama'],
                    'gender' => $row['Jenis_Kelamin'] == 'L' ? 'L' : 'P',
                    'golongan' => $row['Golongan'],
                    'fakultas_id' => $fakultas?->id,
                ]
            );
        }
        fclose($handle);
        $this->command->info('Import Dosen selesai ('.$count.' data).');
    }

    private function importStudents()
    {
        $path = base_path('storage/DOC DB/DB Student Contoh.csv');
        if (! file_exists($path)) {
            $this->command->error('File Student CSV tidak ditemukan di: '.$path);

            return;
        }

        $handle = fopen($path, 'r');
        fgetcsv($handle); // Skip title line
        $header = fgetcsv($handle); // Header line

        // Create/Get Tahun Akademik 2024/2025
        $ta = TahunAkademik::updateOrCreate(
            ['year' => '2024/2025'],
            ['is_active' => true]
        );

        // Create/Get Periode 57
        $periode = Periode::updateOrCreate(
            ['name' => 'Periode 57 - KKN Reguler'],
            [
                'academic_year_id' => $ta->id,
                'periode' => 57,
                'jenis' => 'REGULER',
                'is_active' => true,
                'current_phase' => 'registration',
                'registration_start' => now()->subMonth(),
                'registration_end' => now()->addMonth(),
                'start_date' => now()->addMonths(2),
                'end_date' => now()->addMonths(4),
            ]
        );

        // Faculty Mapping
        $facultyMap = [
            'Dakwah' => 'Fakultas Dakwah',
            'FEBI' => 'Fakultas Ekonomi dan Bisnis Islam',
            'Syariah' => 'Fakultas Syariah',
            'FTIK' => 'Fakultas Tarbiyah dan Ilmu Keguruan',
            'FUAH' => 'Fakultas Ushuluddin, Adab dan Humaniora',
        ];

        $count = 0;
        while (($data = fgetcsv($handle)) !== false) {
            if (count($data) < 10) {
                continue;
            }

            $nim = trim($data[1]);
            $nama = trim($data[2]);
            $gender = trim($data[3]) == 'L' ? 'L' : 'P';
            $fakNamaShort = trim($data[4]);
            $prodiNamaShort = trim($data[5]);
            $ipk = floatval($data[6]);
            $sks = intval($data[7]);
            $wa = trim($data[8]);
            $nik = trim($data[9]);
            $motherName = trim($data[10] ?? '');
            $kaos = trim($data[11] ?? 'L');

            $count++;
            echo 'Importing Student: '.$count."\r";

            // Find or Create Fakultas
            $fakName = $facultyMap[$fakNamaShort] ?? $fakNamaShort;
            $fakultas = Fakultas::firstOrCreate(
                ['nama' => $fakName],
                ['code' => strtoupper(substr($fakNamaShort ?: 'F', 0, 10))]
            );

            // Find or Create Prodi
            $prodi = Prodi::where('code', $prodiNamaShort)->first();
            if (! $prodi) {
                $prodi = Prodi::create([
                    'nama' => $prodiNamaShort,
                    'fakultas_id' => $fakultas->id,
                    'code' => $prodiNamaShort,
                ]);
            }

            // Create User
            $user = User::updateOrCreate(
                ['username' => $nim],
                [
                    'name' => $nama,
                    'email' => $nim.'@student.uinsaizu.ac.id',
                    'password' => Hash::make(env('KKN_LOCAL_SEED_PASSWORD', 'password')),
                    'password_changed_at' => null,
                    'must_change_password' => true,
                    'phone' => $wa,
                    'is_active' => true,
                ]
            );
            $user->assignRole('student');

            $batchYear = strlen($nim) >= 4 && substr($nim, 0, 2) == '20'
                ? substr($nim, 0, 4)
                : '20'.substr($nim, 0, 2);

            // Create Mahasiswa
            $mahasiswa = Mahasiswa::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'nim' => $nim,
                    'nik' => $nik,
                    'nama' => $nama,
                    'mother_name' => $motherName,
                    'gender' => $gender,
                    'fakultas_id' => $fakultas->id,
                    'prodi_id' => $prodi->id,
                    'gpa' => $ipk,
                    'sks_completed' => $sks,
                    'shirt_size' => $kaos,
                    'batch_year' => $batchYear,
                ]
            );
        }
        fclose($handle);
        $this->command->info('Import Mahasiswa (Periode 57) selesai ('.$count.' data).');
    }
}
