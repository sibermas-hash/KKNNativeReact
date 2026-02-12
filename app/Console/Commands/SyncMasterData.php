<?php

namespace App\Console\Commands;

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
            if (str_contains($orgData['name'], 'Fakultas') || $orgData['level'] == 2) {
                Fakultas::on('kkn')->updateOrCreate(
                    ['master_id' => $orgData['id']],
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
            $employees = $this->masterApi->getAllEmployees();
        } else {
            // Direct DB Pull from 'master' connection
            $masterLecturers = MasterLecturer::all();
            foreach ($masterLecturers as $ml) {
                $employees[] = [
                    'id' => $ml->id,
                    'nip' => $ml->nip,
                    'name' => $ml->name,
                    'email' => $ml->email,
                    'phone' => $ml->phone,
                    'organization' => ['code' => 'FTIK'], // Default or logic to find
                ];
            }
        }

        if (empty($employees)) {
            $this->warn('  No lecturers found');
            return;
        }

        $synced = 0;
        $now = now();
        foreach ($employees as $empData) {
            // Find Faculty
            $orgCode = $empData['organization']['code'] ?? null;
            $faculty = $orgCode ? Fakultas::on('kkn')->where('code', $orgCode)->first() : null;

            if (!$faculty) continue;

            // 1. Ensure User account exists
            // username is unique, so use it as the identity key to avoid duplicate inserts
            $username = (string) ($empData['nip'] ?? '');
            $incomingEmail = $empData['email'] ?? null;
            $fallbackEmail = $username . '@kkn.local';

            $user = User::on('kkn')->firstOrNew(['username' => $username]);

            if (!$user->exists) {
                $user->email = !empty($incomingEmail) ? $incomingEmail : $fallbackEmail;
            } elseif (empty($user->email)) {
                $user->email = !empty($incomingEmail) ? $incomingEmail : $fallbackEmail;
            }

            $user->username = $username;
            $user->name = $empData['name'];
            $user->password = Hash::make($username);
            $user->save();

            // 2. Ensure Lecturer record exists (Local KKN)
            Dosen::updateOrCreate(
                ['master_id' => $empData['id']],
                [
                    'user_id' => $user->id,
                    'nip' => $empData['nip'],
                    'nama' => $empData['name'],
                    'faculty_id' => $faculty->id,
                    'phone' => $empData['phone'] ?? null,
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
            $students = $this->masterApi->getAllStudents();
        } else {
            // Direct DB Pull from 'master' connection
            $masterStudents = MasterStudent::all();
            foreach ($masterStudents as $ms) {
                $students[] = [
                    'id' => $ms->id,
                    'nim' => $ms->nim,
                    'name' => $ms->name,
                    'email' => $ms->email,
                    'faculty_code' => $ms->faculty_code ?? 'FTIK',
                    'program_code' => $ms->program_code ?? 'UNKNOWN',
                    'batch_year' => $ms->batch_year ?? date('Y'),
                    'gender' => $ms->gender ?? 'L',
                    'birth_place' => $ms->birth_place,
                    'birth_date' => $ms->birth_date?->format('Y-m-d'),
                ];
            }
        }

        if (empty($students)) {
            $this->warn('  No students found');
            return;
        }

        $synced = 0;
        $now = now();
        foreach ($students as $studData) {
            // Find Faculty & Program
            $faculty = Fakultas::on('kkn')->where('code', $studData['faculty_code'] ?? 'FTIK')->first();
            
            // Program is a bit tricky, let's auto-create if missing or use default
            $program = Prodi::on('kkn')->firstOrCreate(
                ['code' => $studData['program_code'] ?? 'UNKNOWN'],
                [
                    'nama' => $studData['program_name'] ?? 'Unknown Program',
                    'faculty_id' => $faculty?->id ?? Fakultas::on('kkn')->first()?->id,
                ]
            );

            if (!$faculty) continue;

            // 1. Ensure User account exists
            // username is unique, so use it as the identity key to avoid duplicate inserts
            $username = (string) ($studData['nim'] ?? '');
            $incomingEmail = $studData['email'] ?? null;
            $fallbackEmail = $username . '@kkn.local';

            $user = User::on('kkn')->firstOrNew(['username' => $username]);

            if (!$user->exists) {
                $user->email = !empty($incomingEmail) ? $incomingEmail : $fallbackEmail;
            } elseif (empty($user->email)) {
                $user->email = $fallbackEmail;
            }

            $user->username = $username;
            $user->name = $studData['name'];
            $user->password = Hash::make($username);
            $user->save();

            // 2. Ensure Student record exists (Local KKN)
            Mahasiswa::updateOrCreate(
                ['master_id' => $studData['id']],
                [
                    'user_id' => $user->id,
                    'nim' => $studData['nim'],
                    'nama' => $studData['name'],
                    'faculty_id' => $faculty->id,
                    'program_id' => $program->id,
                    'batch_year' => $studData['batch_year'] ?? date('Y'),
                    'gender' => $studData['gender'] ?? 'L',
                    'birth_place' => $studData['birth_place'] ?? null,
                    'birth_date' => $studData['birth_date'] ?? null,
                    'master_synced_at' => $now,
                ]
            );
            $synced++;
        }

        $this->info("  {$synced} students synced");
    }
}
