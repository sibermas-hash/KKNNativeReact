<?php

namespace Database\Seeders;

use App\Models\KKN\Fakultas;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Prodi;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Models\Role;

class StudentCsvSeeder extends Seeder
{
    public function run(): void
    {
        $csvFile = '/Users/macm4/Documents/KKN/kknuinsaizu/storage/DOC DB/DB Student Contoh.csv';

        if (! file_exists($csvFile)) {
            Log::error("SEEDER ERROR: File tidak ditemukan di {$csvFile}");

            return;
        }

        $handle = fopen($csvFile, 'r');
        fgetcsv($handle); // Title
        fgetcsv($handle); // Header

        Log::info('SEEDER START: Memproses CSV');

        DB::beginTransaction();
        try {
            $studentRole = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
            $count = 0;

            while (($data = fgetcsv($handle)) !== false) {
                if (count($data) < 10) {
                    continue;
                }

                $nim = trim($data[1]);
                $nama = trim($data[2]);
                $gender = trim($data[3]) === 'L' ? 'L' : 'P';
                $namaFakultas = trim($data[4]);
                $namaProdi = trim($data[5]);
                $gpa = (float) $data[6];
                $sks = (int) $data[7];
                $phone = trim($data[8]);
                $nik = trim($data[9]);
                $motherName = trim($data[10]);
                $shirtSize = trim($data[11]);

                $batchYear = (int) substr($nim, 0, 4);
                if ($batchYear < 2000) {
                    $batchYear = 2022;
                }

                $fakultas = Fakultas::firstOrCreate(['nama' => $namaFakultas], ['code' => strtoupper(substr($namaFakultas, 0, 3))]);
                $prodi = Prodi::firstOrCreate(['nama' => $namaProdi, 'fakultas_id' => $fakultas->id], ['code' => strtoupper(substr($namaProdi, 0, 3))]);

                $user = User::updateOrCreate(
                    ['username' => $nim],
                    ['name' => $nama, 'phone' => $phone, 'password' => Hash::make(env('KKN_LOCAL_SEED_PASSWORD', 'password')), 'email_verified_at' => now()]
                );

                if (! $user->hasRole('student')) {
                    $user->assignRole($studentRole);
                }

                Mahasiswa::updateOrCreate(
                    ['nim' => $nim],
                    [
                        'user_id' => $user->id, 'nama' => $nama, 'fakultas_id' => $fakultas->id, 'prodi_id' => $prodi->id,
                        'batch_year' => $batchYear, 'gender' => $gender, 'gpa' => $gpa, 'sks_completed' => $sks,
                        'nik' => $nik, 'mother_name' => $motherName, 'shirt_size' => $shirtSize,
                        'is_bta_ppi_passed' => true, 'status_bta_ppi' => 'LULUS',
                    ]
                );
                $count++;
            }

            DB::commit();
            Log::info("SEEDER SUCCESS: Berhasil mengimpor {$count} mahasiswa.");
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('SEEDER FATAL ERROR: '.$e->getMessage());
        }

        fclose($handle);
    }
}
