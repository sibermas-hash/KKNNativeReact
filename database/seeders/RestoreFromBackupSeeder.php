<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\KKN\Dosen;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\Fakultas;
use App\Models\KKN\Prodi;
use App\Models\KKN\TahunAkademik;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

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
            $this->command->error('Restorasi gagal: ' . $e->getMessage());
        }
    }

    private function importDosen()
    {
        $path = base_path('dosen_backup_470.csv');
        if (!file_exists($path)) return;

        $lines = file($path);
        $header = str_getcsv(array_shift($lines));

        foreach ($lines as $index => $line) {
            $data = str_getcsv($line);
            if (count($data) < 4) continue;
            
            $row = array_combine($header, $data);
            
            echo "Importing Dosen: " . ($index + 1) . "/" . count($lines) . "\r";
            
            $user = User::updateOrCreate(
                ['username' => $row['NIP']],
                [
                    'name' => $row['Nama'],
                    'email' => $row['Email'] ?: ($row['NIP'] . '@kkn.uinsaizu.ac.id'),
                    'password' => Hash::make('Password#123'),
                    'phone' => $row['Telepon'] ?: null,
                    'is_active' => true,
                ]
            );

            $user->assignRole('dpl');

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
        $this->command->info('Import Dosen selesai.');
    }

    private function importStudents()
    {
        $path = base_path('DataKKN_57-KKN Reguler-setuju.xls');
        if (!file_exists($path)) return;

        $html = file_get_contents($path);
        preg_match_all('/<tr>(.*?)<\/tr>/s', $html, $matches);

        if (count($matches[1]) < 2) return;

        // Header mapping
        $headerLine = $matches[1][0];
        preg_match_all('/<td>(.*?)<\/td>/', $headerLine, $headerMatches);
        $headers = $headerMatches[1];

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

        for ($i = 1; $i < count($matches[1]); $i++) {
            echo "Importing Student: " . $i . "/" . (count($matches[1]) - 1) . "\r";
            preg_match_all('/<td>(.*?)<\/td>/', $matches[1][$i], $colMatches);
            $cols = $colMatches[1];
            
            if (count($cols) < 10) continue;

            $nim = trim($cols[1]);
            $nama = trim($cols[2]);
            $gender = trim($cols[3]) == 'L' ? 'L' : 'P';
            $fakNamaShort = trim($cols[4]);
            $prodiNamaShort = trim($cols[5]);
            $ipk = floatval(str_replace("'", "", $cols[6]));
            $sks = intval($cols[7]);
            $wa = trim($cols[8]);
            $nik = str_replace("'", "", trim($colMatches[1][9] ?? ''));
            $kaos = trim($colMatches[1][11] ?? 'L');
            $legacyNotes = trim($colMatches[1][14] ?? '');
            $legacyStatus = trim($colMatches[1][13] ?? '');

            // Combine into a searchable note for audit
            $auditNote = "Status Sistem Lama: " . strtoupper($legacyStatus);
            if ($legacyNotes) {
                $auditNote .= " | Catatan: " . $legacyNotes;
            }
            $auditNote .= " | Registrasi via: Restorasi Sistem (2026)";

            // Find or Create Fakultas
            $fakName = $facultyMap[$fakNamaShort] ?? $fakNamaShort;
            $fakultas = Fakultas::firstOrCreate(
                ['nama' => $fakName],
                ['code' => strtoupper(substr($fakNamaShort ?: 'F', 0, 10))]
            );

            // Find or Create Prodi
            $prodi = Prodi::where('code', $prodiNamaShort)->first();
            if (!$prodi) {
                $prodi = Prodi::create([
                    'nama' => $prodiNamaShort,
                    'fakultas_id' => $fakultas->id,
                    'code' => $prodiNamaShort
                ]);
            }

            // Create User
            $user = User::updateOrCreate(
                ['username' => $nim],
                [
                    'name' => $nama,
                    'email' => $nim . '@student.uinsaizu.ac.id',
                    'password' => Hash::make('Password#123'),
                    'phone' => $wa,
                    'is_active' => true,
                ]
            );
            $user->assignRole('student');

            $batchYear = strlen($nim) >= 4 && substr($nim, 0, 2) == '20' 
                ? substr($nim, 0, 4) 
                : '20' . substr($nim, 0, 2);

            // Create Mahasiswa
            $mahasiswa = Mahasiswa::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'nim' => $nim,
                    'nik' => $nik,
                    'nama' => $nama,
                    'gender' => $gender,
                    'fakultas_id' => $fakultas->id,
                    'prodi_id' => $prodi->id,
                    'gpa' => $ipk,
                    'sks_completed' => $sks,
                    'shirt_size' => $kaos,
                    'batch_year' => $batchYear,
                ]
            );

            // SKIP automatic registration as PesertaKkn per user request
            // Just maintain Mahasiswa master data
        }
        $this->command->info('Import Mahasiswa (Periode 57) selesai.');
    }
}
