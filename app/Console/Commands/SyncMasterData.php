<?php

namespace App\Console\Commands;

use App\Helpers\PasswordHelper;
use App\Models\KKN\Fakultas;
use App\Models\KKN\Dosen;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Prodi;
use App\Models\Master\Dosen as MasterLecturer;
use App\Models\Master\Mahasiswa as MasterStudent;
use App\Models\User;
use App\Services\MasterApiService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SyncMasterData extends Command
{
    protected $signature = 'sync:master-data
        {--type=all : Type of data to sync (all, mahasiswa, dosen, fakultas)}
        {--source=api : Source of data (api or db)}
        {--force : Force sync even if cache is fresh}';

    protected $description = 'Sync identity data from Master API Service to KKN local database';

    protected MasterApiService $masterApi;

    public function __construct(MasterApiService $masterApi)
    {
        parent::__construct();
        $this->masterApi = $masterApi;
    }

    public function handle(): int
    {
        $type = $this->option('type');

        if ($this->option('force')) {
            $this->masterApi->clearCache();
            $this->info('Cache cleared.');
        }

        if ($this->option('source') === 'api') {
            // Health check first
            $health = $this->masterApi->healthCheck();
            if (($health['status'] ?? 'DOWN') !== 'UP') {
                $this->error('Master API is DOWN: ' . ($health['error'] ?? 'Unknown error'));
                return 1;
            }
            $this->info('Master API is UP');
        } else {
            $this->info('Syncing directly from Master Database');
            try {
                DB::connection('master')->getPdo();
                $this->info('Master DB connection is UP');
            } catch (\Exception $e) {
                $this->error('Master DB connection failed: ' . $e->getMessage());
                return 1;
            }
        }

        DB::beginTransaction();

        try {
            if (in_array($type, ['all', 'fakultas'])) {
                $this->syncFaculties();
            }

            if (in_array($type, ['all', 'dosen'])) {
                $this->syncLecturers();
            }

            if (in_array($type, ['all', 'mahasiswa'])) {
                $this->syncStudents();
            }

            DB::commit();
            $this->newLine();
            $this->info('Sync completed successfully.');
            return 0;
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('Sync failed: ' . $e->getMessage());
            Log::error('Master API sync failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return 1;
        }
    }

    protected function syncFaculties(): void
    {
        $this->info('Syncing faculties...');
        
        if ($this->option('source') === 'api') {
            $orgs = $this->masterApi->getAllOrganizations();
        } else {
            $this->warn('  Direct DB sync for faculties not fully implemented (skipping). Use API source.');
            return;
        }

        $synced = 0;
        $now = now();
        foreach ($orgs as $orgData) {
            // Only sync faculties (check if name contains 'Fakultas')
            if (str_contains($orgData['name'], 'Fakultas') || ($orgData['level'] ?? 0) == 2) {
                Fakultas::on('kkn')->updateOrCreate(
                    ['master_id' => (string) $orgData['id']],
                    [
                        'code' => $orgData['code'],
                        'nama' => $orgData['name'],
                        'master_synced_at' => $now,
                    ]
                );
                $synced++;
            }
        }

        $this->info("  {$synced} faculties synced");
    }

    protected function syncLecturers(): void
    {
        $this->info('Syncing lecturers (DPL)...');
        
        $employees = [];
        if ($this->option('source') === 'api') {
            $employees = $this->masterApi->getSyncDosen();
            $this->info("  Fetched " . count($employees) . " lecturers from API");
        } else {
            // Direct DB Pull from 'master' connection
            $masterLecturers = MasterLecturer::all();
            foreach ($masterLecturers as $ml) {
                $employees[] = [
                    'id' => $ml->id,
                    'nip' => $ml->nip,
                    'nama' => $ml->nama,
                    'email' => $ml->email,
                    'telepon' => $ml->telepon,
                    'organization' => ['code' => 'FTIK'], 
                ];
            }
        }

        if (empty($employees)) {
            $this->warn('  No lecturers found');
            return;
        }

        $synced = 0;
        $now = now();
        
        // Default faculty if not found in data
        $defaultFaculty = Fakultas::on('kkn')->first();
        if (!$defaultFaculty) {
            $defaultFaculty = Fakultas::on('kkn')->create([
                'code' => 'DEFAULT',
                'nama' => 'Default Faculty',
                'master_id' => '0',
                'master_synced_at' => $now,
            ]);
            $this->info('  Created Default Faculty as fallback');
        }

        foreach ($employees as $empData) {
            // Use 'nip' as stable identifier
            $nip = $empData['nip'] ?? null;
            if (!$nip) continue;

            // 1. Ensure User account exists
            $username = (string) $nip;
            $incomingEmail = $empData['email'] ?? null;
            $fallbackEmail = $username . '@kkn.local';

            $user = User::on('kkn')->firstOrNew(['username' => $username]);
            $isNewUser = !$user->exists;

            if ($isNewUser) {
                $user->email = !empty($incomingEmail) ? $incomingEmail : $fallbackEmail;
            } elseif (empty($user->email)) {
                $user->email = !empty($incomingEmail) ? $incomingEmail : $fallbackEmail;
            }

            $user->username = $username;
            $user->name = $empData['nama'] ?? $empData['name'] ?? 'Unknown';

            // Only set password for NEW users — never overwrite existing passwords
            if ($isNewUser) {
                $birthDate = $empData['tanggal_lahir'] ?? $empData['birth_date'] ?? null;
                $user->password = Hash::make(
                    PasswordHelper::fromBirthDate($birthDate, $username)
                );
            }

            $user->save();
            
            // Assign Role
            if (!$user->hasRole('dpl')) {
                $user->assignRole('dpl');
            }

            // 2. Ensure Lecturer record exists (Local KKN)
            // Note: KKN Dosen table uses 'nama', 'phone'
            // Qualification Logic: Map CPNS status and Duty Study (Tugas Belajar)
            $statusPegawai = strtoupper($empData['status_pegawai'] ?? $empData['employment_status'] ?? '');
            $isCpns = str_contains($statusPegawai, 'CPNS');
            
            $statusAktif = strtoupper($empData['status_aktif'] ?? $empData['active_status'] ?? 'AKTIF');
            $isTugasBelajar = str_contains($statusAktif, 'TUGAS BELAJAR') || ($empData['is_tugas_belajar'] ?? false);

            Dosen::on('kkn')->updateOrCreate(
                ['nip' => $nip],
                [
                    'master_id' => (string) $empData['id'],
                    'user_id' => $user->id,
                    'nama' => $empData['nama'] ?? $empData['name'] ?? 'Unknown',
                    'faculty_id' => $defaultFaculty?->id, // TO DO: logic to map unit_kerja to faculty
                    'phone' => $empData['telepon'] ?? $empData['phone'] ?? null,
                    'gender' => $empData['jenis_kelamin'] ?? $empData['gender'] ?? 'L',
                    'birth_date' => $empData['tanggal_lahir'] ?? $empData['birth_date'] ?? null,
                    'is_cpns' => $isCpns,
                    'is_tugas_belajar' => $isTugasBelajar,
                    'master_synced_at' => $now,
                ]
            );
            $synced++;
        }

        $this->info("  {$synced} lecturers synced");
    }

    protected function syncStudents(): void
    {
        $this->info('Syncing students...');
        
        $students = [];
        if ($this->option('source') === 'api') {
            $students = $this->masterApi->getSyncMahasiswa();
            $this->info("  Fetched " . count($students) . " students from API");
        } else {
            // Direct DB Pull from 'master' connection
            $masterStudents = MasterStudent::all();
            foreach ($masterStudents as $ms) {
                $students[] = [
                    'id' => $ms->id,
                    'nim' => $ms->nim,
                    'nama' => $ms->nama,
                    'email' => $ms->email,
                    'prodi' => $ms->prodi,
                    'angkatan' => $ms->angkatan,
                    'jenis_kelamin' => $ms->jenis_kelamin,
                    'tempat_lahir' => $ms->tempat_lahir ?? null,
                    'tanggal_lahir' => $ms->tanggal_lahir,
                ];
            }
        }

        if (empty($students)) {
            $this->warn('  No students found');
            return;
        }

        $synced = 0;
        $now = now();
        $defaultFaculty = Fakultas::on('kkn')->first();
        if (!$defaultFaculty) {
            $defaultFaculty = Fakultas::on('kkn')->create([
                'code' => 'DEFAULT',
                'nama' => 'Default Faculty', 
                'master_id' => '0',
                'master_synced_at' => $now,
            ]);
            $this->info('  Created Default Faculty as fallback');
        }

        foreach ($students as $studData) {
            $nim = $studData['nim'] ?? null;
            if (!$nim) continue;

            // Map Prodi (Program Studi)
            // Master API returns 'prodi' as string name usually
            $prodiName = $studData['prodi'] ?? 'Unknown Program';
            $programLookup = isset($studData['prodi_id'])
                ? ['master_id' => (string) $studData['prodi_id']]
                : ['nama' => $prodiName];

            $program = Prodi::on('kkn')->updateOrCreate(
                $programLookup,
                [
                    'code' => strtoupper(substr(Str::slug($prodiName), 0, 10)),
                    'nama' => $prodiName,
                    'faculty_id' => $defaultFaculty?->id,
                    'master_synced_at' => $now,
                ]
            );

            // 1. Ensure User account exists
            $username = (string) $nim;
            $incomingEmail = $studData['email'] ?? null;
            $fallbackEmail = $username . '@kkn.local';

            $user = User::on('kkn')->firstOrNew(['username' => $username]);
            $isNewUser = !$user->exists;

            if ($isNewUser) {
                $user->email = !empty($incomingEmail) ? $incomingEmail : $fallbackEmail;
            } elseif (empty($user->email)) {
                $user->email = $fallbackEmail;
            }

            $user->username = $username;
            $user->name = $studData['nama'] ?? $studData['name'] ?? 'Unknown';

            // Only set password for NEW users — never overwrite existing passwords
            if ($isNewUser) {
                $user->password = Hash::make(\Illuminate\Support\Str::password(12));
            }

            $user->save();
            
            // Assign Role
            if (!$user->hasRole('student')) {
                $user->assignRole('student');
            }

            // 2. Ensure Student record exists (Local KKN)
            // Mapping fields: nama, batch_year (angkatan), gender (jenis_kelamin), birth_date (tanggal_lahir)
            // Plus requirements: total_sks, status_bta_ppi, semester
            Mahasiswa::on('kkn')->updateOrCreate(
                ['nim' => $nim],
                [
                    'master_id' => (string) $studData['id'],
                    'user_id' => $user->id,
                    'nama' => $studData['nama'] ?? $studData['name'] ?? 'Unknown',
                    'faculty_id' => $defaultFaculty?->id, // Default for now
                    'program_id' => $program->id,
                    'batch_year' => $studData['angkatan'] ?? $studData['batch_year'] ?? date('Y'),
                    'gender' => $studData['jenis_kelamin'] ?? $studData['gender'] ?? 'L',
                    'birth_place' => $studData['tempat_lahir'] ?? $studData['birth_place'] ?? null,
                    'birth_date' => $studData['tanggal_lahir'] ?? $studData['birth_date'] ?? null,
                    'total_sks' => $studData['total_sks'] ?? 0,
                    'status_bta_ppi' => $studData['status_bta_ppi'] ?? 'BELUM_LULUS',
                    'semester' => $studData['semester'] ?? null,
                    'master_synced_at' => $now,
                ]
            );
            $synced++;
        }

        $this->info("  {$synced} students synced");
    }
}
