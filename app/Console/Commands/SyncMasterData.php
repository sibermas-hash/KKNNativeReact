<?php

namespace App\Console\Commands;

use App\Models\Faculty;
use App\Models\Lecturer;
use App\Models\Student;
use App\Models\User;
use App\Models\Program;
use App\Services\MasterApiService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;

class SyncMasterData extends Command
{
    protected $signature = 'master:sync
        {--type=all : Type of data to sync (all, students, lecturers, faculties)}
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

        // Health check first
        $health = $this->masterApi->healthCheck();
        if (($health['status'] ?? 'DOWN') !== 'UP') {
            $this->error('Master API is DOWN: ' . ($health['error'] ?? 'Unknown error'));
            return 1;
        }
        $this->info('Master API is UP');

        DB::beginTransaction();

        try {
            if (in_array($type, ['all', 'faculties'])) {
                $this->syncFaculties();
            }

            if (in_array($type, ['all', 'lecturers'])) {
                $this->syncLecturers();
            }

            if (in_array($type, ['all', 'students'])) {
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
        $orgs = $this->masterApi->getAllOrganizations();

        if (empty($orgs)) {
            $this->warn('  No organizations found from Master API');
            return;
        }

        $synced = 0;
        $now = now();
        foreach ($orgs as $orgData) {
            // Only sync faculties (check if name contains 'Fakultas')
            if (str_contains($orgData['name'], 'Fakultas') || $orgData['level'] == 2) {
                Faculty::updateOrCreate(
                    ['code' => $orgData['code']],
                    [
                        'name' => $orgData['name'],
                        'master_id' => $orgData['id'],
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
        $employees = $this->masterApi->getAllEmployees();

        if (empty($employees)) {
            $this->warn('  No employees found from Master API');
            return;
        }

        $synced = 0;
        $now = now();
        foreach ($employees as $empData) {
            // Find Faculty
            $orgCode = $empData['organization']['code'] ?? null;
            $faculty = $orgCode ? Faculty::where('code', $orgCode)->first() : null;

            if (!$faculty) continue;

            // 1. Ensure User account exists
            $user = User::updateOrCreate(
                ['email' => $empData['email'] ?? ($empData['nip'] . '@kkn.local')],
                [
                    'username' => $empData['nip'],
                    'name' => $empData['name'],
                    'password' => Hash::make($empData['nip']),
                ]
            );

            // 2. Ensure Lecturer record exists
            Lecturer::updateOrCreate(
                ['nip' => $empData['nip']],
                [
                    'user_id' => $user->id,
                    'name' => $empData['name'],
                    'faculty_id' => $faculty->id,
                    'phone' => $empData['phone'] ?? null,
                    'master_id' => $empData['id'],
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
        $students = $this->masterApi->getAllStudents();

        if (empty($students)) {
            $this->warn('  No students found from Master API');
            return;
        }

        $synced = 0;
        $now = now();
        foreach ($students as $studData) {
            // Find Faculty & Program
            $faculty = Faculty::where('code', $studData['faculty_code'] ?? 'FTIK')->first();
            
            // Program is a bit tricky, let's auto-create if missing or use default
            $program = Program::firstOrCreate(
                ['code' => $studData['program_code'] ?? 'UNKNOWN'],
                [
                    'name' => $studData['program_name'] ?? 'Unknown Program',
                    'faculty_id' => $faculty?->id ?? Faculty::first()?->id,
                ]
            );

            if (!$faculty) continue;

            // 1. Ensure User account exists
            $user = User::updateOrCreate(
                ['email' => $studData['email'] ?? ($studData['nim'] . '@kkn.local')],
                [
                    'username' => $studData['nim'],
                    'name' => $studData['name'],
                    'password' => Hash::make($studData['nim']),
                ]
            );

            // 2. Ensure Student record exists
            Student::updateOrCreate(
                ['nim' => $studData['nim']],
                [
                    'user_id' => $user->id,
                    'name' => $studData['name'],
                    'faculty_id' => $faculty->id,
                    'program_id' => $program->id,
                    'batch_year' => $studData['batch_year'] ?? date('Y'),
                    'gender' => $studData['gender'] ?? 'L',
                    'birth_place' => $studData['birth_place'] ?? null,
                    'birth_date' => $studData['birth_date'] ?? null,
                    'master_id' => $studData['id'],
                    'master_synced_at' => $now,
                ]
            );
            $synced++;
        }

        $this->info("  {$synced} students synced");
    }
}
