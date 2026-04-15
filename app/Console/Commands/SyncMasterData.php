<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Helpers\PasswordHelper;
use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Prodi;
use App\Models\KKN\SyncLog;
use App\Models\KKN\SystemSetting;
use App\Models\Master\Dosen as MasterLecturer;
use App\Models\Master\Mahasiswa as MasterStudent;
use App\Models\User;
use App\Services\MasterApiService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\Console\Attribute\AsCommand;

#[AsCommand(name: 'sync:master-data')]
class SyncMasterData extends Command
{
    protected $signature = 'sync:master-data
        {--type=all : Type of data to sync (all, mahasiswa, dosen, fakultas)}
        {--source=api : Source of data (api or db)}
        {--delta : Run a delta sync based on last sync time}
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
                $this->error('Master API is DOWN: '.($health['error'] ?? 'Unknown error'));

                return 1;
            }
            $this->info('Master API is UP');
        } else {
            $this->info('Syncing directly from Master Database');
            try {
                DB::connection('master')->getPdo();
                $this->info('Master DB connection is UP');
            } catch (\Exception $e) {
                $this->error('Master DB connection failed: '.$e->getMessage());

                return 1;
            }
        }

        // REMOVED: DB::beginTransaction() at global level to prevent long-running mass locks
        // We will use individual transactions or direct writes per record for stability

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

            $this->newLine();
            $this->info('Sync completed successfully.');

            return 0;
        } catch (\Exception $e) {
            $this->error('Sync failed: '.$e->getMessage());
            Log::error('Master API sync failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return 1;
        }
    }

    protected function syncFaculties(): void
    {
        $this->info('Syncing faculties...');
        
        $startTime = now();
        $isDelta = $this->option('delta');
        $source = $this->option('source');

        if ($source === 'api') {
            // Usually organizations are small, so we fetch all, but PRD asks for consistency
            $orgs = $this->masterApi->getAllOrganizations();
        } else {
            $this->warn('  Direct DB sync for faculties not fully implemented (skipping). Use API source.');
            return;
        }

        $stats = [
            'total_fetched' => count($orgs),
            'total_created' => 0,
            'total_updated' => 0,
            'total_skipped' => 0,
            'total_errors' => 0,
        ];
        $errorDetails = [];
        $now = now();

        foreach ($orgs as $orgData) {
            try {
                // Only sync faculties (check if name contains 'Fakultas' or specific level)
                if (str_contains($orgData['name'], 'Fakultas') || ($orgData['level'] ?? 0) == 2) {
                    $faculty = Fakultas::on('kkn')->updateOrCreate(
                        ['master_id' => (string) $orgData['id']],
                        [
                            'code' => $orgData['code'],
                            'nama' => $orgData['name'],
                            'master_synced_at' => $now,
                        ]
                    );

                    if ($faculty->wasRecentlyCreated) {
                        $stats['total_created']++;
                    } else {
                        $stats['total_updated']++;
                    }
                } else {
                    $stats['total_skipped']++;
                }
            } catch (\Exception $e) {
                $stats['total_errors']++;
                $errorDetails[] = ['id' => $orgData['id'] ?? 'unknown', 'error' => $e->getMessage()];
                Log::warning("Failed to sync faculty", ['id' => $orgData['id'] ?? 'unknown', 'error' => $e->getMessage()]);
            }
        }

        $endTime = now();
        $duration = $endTime->diffInSeconds($startTime);

        SyncLog::create([
            'sync_type' => $isDelta ? 'delta' : 'full',
            'entity_type' => 'fakultas',
            'status' => $stats['total_errors'] > 0 ? 'partial_success' : 'success',
            'total_fetched' => $stats['total_fetched'],
            'total_created' => $stats['total_created'],
            'total_updated' => $stats['total_updated'],
            'total_skipped' => $stats['total_skipped'],
            'total_errors' => $stats['total_errors'],
            'error_details' => empty($errorDetails) ? null : $errorDetails,
            'duration_seconds' => $duration,
            'triggered_by' => app()->runningInConsole() ? 'artisan' : 'scheduler',
            'started_at' => $startTime,
            'finished_at' => $endTime,
        ]);

        $this->info("  {$stats['total_fetched']} organizations processed ({$stats['total_created']} faculties created, {$stats['total_updated']} updated)");
    }

    protected function syncLecturers(): void
    {
        $this->info('Syncing lecturers (DPL)...');

        $source = $this->option('source');
        $isDelta = $this->option('delta');
        $since = $isDelta ? SystemSetting::get('last_sync_dosen', now()->subDay()->toIso8601String()) : null;

        if ($source === 'api') {
            $employees = $this->masterApi->yieldSyncDosen($since);
        } else {
            // Direct DB Pull from 'master' connection
            $employees = MasterLecturer::when($isDelta && $since, fn($q) => $q->where('updated_at', '>=', $since))->cursor();
        }

        $this->processLecturersSync($employees, $source, $isDelta);
    }

    protected function processLecturersSync(iterable $employees, string $source, bool $isDelta): void
    {
        $startTime = now();
        $stats = [
            'total_fetched' => 0,
            'total_created' => 0,
            'total_updated' => 0,
            'total_skipped' => 0,
            'total_errors' => 0,
        ];
        $errorDetails = [];
        
        $now = now();

        // Default faculty if not found in data
        $defaultFaculty = Fakultas::on('kkn')->first();
        if (! $defaultFaculty) {
            $defaultFaculty = Fakultas::on('kkn')->create([
                'code' => 'DEFAULT',
                'nama' => 'Default Faculty',
                'master_id' => '0',
                'master_synced_at' => $now,
            ]);
            $this->info('  Created Default Faculty as fallback');
        }

        foreach ($employees as $emp) {
            $stats['total_fetched']++;
            
            try {
                // Normalizing data between DB and API
                $empData = ($source === 'db') ? [
                    'id' => $emp->id,
                    'nip' => $emp->nip,
                    'nama' => $emp->nama,
                    'email' => $emp->email,
                    'telepon' => $emp->telepon,
                    'tanggal_lahir' => $emp->tanggal_lahir,
                    'jenis_kelamin' => $emp->jenis_kelamin,
                    'status_pegawai' => $emp->status_pegawai,
                    'status_aktif' => $emp->status_aktif,
                ] : $emp;

                // Use 'nip' as stable identifier
                $nip = $empData['nip'] ?? null;
                if (! $nip) {
                    $stats['total_skipped']++;
                    continue;
                }

                // 1. Ensure User account exists
                $username = (string) $nip;
                $incomingEmail = $empData['email'] ?? null;
                $fallbackEmail = $username.'@kkn.local';

                DB::transaction(function () use ($empData, $nip, $username, $incomingEmail, $fallbackEmail, &$stats, $now, $defaultFaculty) {
                    $user = User::on('kkn')->firstOrNew(['username' => $username]);
                    $isNewUser = ! $user->exists;

                    if ($isNewUser) {
                        $user->email = ! empty($incomingEmail) ? $incomingEmail : $fallbackEmail;
                    } elseif (empty($user->email)) {
                        $user->email = ! empty($incomingEmail) ? $incomingEmail : $fallbackEmail;
                    }

                    $user->username = $username;
                    $user->name = $empData['nama'] ?? $empData['name'] ?? 'Unknown';

                    if ($isNewUser) {
                        $birthDate = $empData['tanggal_lahir'] ?? $empData['birth_date'] ?? null;
                        $user->password = Hash::make(
                            PasswordHelper::fromBirthDate($birthDate, $username)
                        );
                    }

                    $user->save();

                    if (! $user->hasRole('dpl')) {
                        $user->assignRole('dpl');
                    }

                    $statusPegawai = strtoupper($empData['status_pegawai'] ?? $empData['employment_status'] ?? '');
                    $isCpns = str_contains($statusPegawai, 'CPNS');

                    $statusAktif = strtoupper($empData['status_aktif'] ?? $empData['active_status'] ?? 'AKTIF');
                    $isTugasBelajar = str_contains($statusAktif, 'TUGAS BELAJAR') || ($empData['is_tugas_belajar'] ?? false);

                    $dosen = Dosen::on('kkn')->updateOrCreate(
                        ['nip' => $nip],
                        [
                            'master_id' => (string) $empData['id'],
                            'user_id' => $user->id,
                            'nama' => $empData['nama'] ?? $empData['name'] ?? 'Unknown',
                            'faculty_id' => $defaultFaculty?->id,
                            'phone' => $empData['telepon'] ?? $empData['phone'] ?? null,
                            'gender' => $empData['jenis_kelamin'] ?? $empData['gender'] ?? 'L',
                            'birth_date' => $empData['tanggal_lahir'] ?? $empData['birth_date'] ?? null,
                            'is_cpns' => $isCpns,
                            'is_tugas_belajar' => $isTugasBelajar,
                            'master_synced_at' => $now,
                        ]
                    );
                    
                    if ($dosen->wasRecentlyCreated) {
                        $stats['total_created']++;
                    } else {
                        $stats['total_updated']++;
                    }
                });

                if ($stats['total_fetched'] % 100 === 0) {
                    $this->info("    Processed {$stats['total_fetched']} lecturers...");
                }
            } catch (\Exception $e) {
                $stats['total_errors']++;
                $errorDetails[] = ['nip' => $nip ?? 'unknown', 'error' => $e->getMessage()];
                Log::warning("Failed to sync lecturer", ['nip' => $nip ?? 'unknown', 'error' => $e->getMessage()]);
            }
        }

        $endTime = now();
        $duration = $endTime->diffInSeconds($startTime);

        SyncLog::create([
            'sync_type' => $isDelta ? 'delta' : 'full',
            'entity_type' => 'dosen',
            'status' => $stats['total_errors'] > 0 ? ($stats['total_updated'] + $stats['total_created'] > 0 ? 'partial_success' : 'failed') : 'success',
            'total_fetched' => $stats['total_fetched'],
            'total_created' => $stats['total_created'],
            'total_updated' => $stats['total_updated'],
            'total_skipped' => $stats['total_skipped'],
            'total_errors' => $stats['total_errors'],
            'error_details' => empty($errorDetails) ? null : $errorDetails,
            'duration_seconds' => $duration,
            'triggered_by' => app()->runningInConsole() ? 'artisan' : 'scheduler',
            'started_at' => $startTime,
            'finished_at' => $endTime,
        ]);
        
        SystemSetting::set('last_sync_dosen', $now->toIso8601String());

        $this->info("  {$stats['total_fetched']} lecturers synced ({$stats['total_created']} created, {$stats['total_updated']} updated) in {$duration}s");
    }

    protected function syncStudents(): void
    {
        $this->info('Syncing students...');

        $source = $this->option('source');
        $isDelta = $this->option('delta');
        $since = $isDelta ? SystemSetting::get('last_sync_mahasiswa', now()->subDay()->toIso8601String()) : null;

        if ($source === 'api') {
            $students = $this->masterApi->yieldSyncMahasiswa($since);
        } else {
            // Direct DB Pull from 'master' connection
            $students = MasterStudent::when($isDelta && $since, fn($q) => $q->where('updated_at', '>=', $since))->cursor();
        }

        $this->processStudentsSync($students, $source, $isDelta);
    }

    protected function processStudentsSync(iterable $students, string $source, bool $isDelta): void
    {
        $startTime = now();
        $stats = [
            'total_fetched' => 0,
            'total_created' => 0,
            'total_updated' => 0,
            'total_skipped' => 0,
            'total_errors' => 0,
        ];
        $errorDetails = [];
        
        $now = now();
        $defaultFaculty = Fakultas::on('kkn')->first();
        if (! $defaultFaculty) {
            $defaultFaculty = Fakultas::on('kkn')->create([
                'code' => 'DEFAULT',
                'nama' => 'Default Faculty',
                'master_id' => '0',
                'master_synced_at' => $now,
            ]);
            $this->info('  Created Default Faculty as fallback');
        }

        foreach ($students as $stud) {
            $stats['total_fetched']++;
            
            try {
                // Normalizing data between DB and API
                $studData = ($source === 'db') ? [
                    'id' => $stud->id,
                    'nim' => $stud->nim,
                    'nama' => $stud->nama,
                    'email' => $stud->email,
                    'prodi' => $stud->prodi,
                    'prodi_id' => $stud->prodi_id ?? null,
                    'angkatan' => $stud->angkatan,
                    'jenis_kelamin' => $stud->jenis_kelamin,
                    'tempat_lahir' => $stud->tempat_lahir,
                    'tanggal_lahir' => $stud->tanggal_lahir,
                    'total_sks' => $stud->total_sks ?? 0,
                    'status_bta_ppi' => $stud->status_bta_ppi ?? 'BELUM_LULUS',
                    'semester' => $stud->semester ?? null,
                ] : $stud;

                $nim = $studData['nim'] ?? null;
                if (! $nim) {
                    $stats['total_skipped']++;
                    continue;
                }

                DB::transaction(function () use ($studData, $nim, $now, $defaultFaculty, &$stats) {
                    // Map Prodi (Program Studi)
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
                    $fallbackEmail = $username.'@kkn.local';

                    $user = User::on('kkn')->firstOrNew(['username' => $username]);
                    $isNewUser = ! $user->exists;

                    if ($isNewUser) {
                        $user->email = ! empty($incomingEmail) ? $incomingEmail : $fallbackEmail;
                    } elseif (empty($user->email)) {
                        $user->email = $fallbackEmail;
                    }

                    $user->username = $username;
                    $user->name = $studData['nama'] ?? $studData['name'] ?? 'Unknown';

                    if ($isNewUser) {
                        $user->password = Hash::make(Str::password(12));
                    }

                    $user->save();

                    if (! $user->hasRole('student')) {
                        $user->assignRole('student');
                    }

                    // 2. Ensure Student record exists (Local KKN)
                    $mahasiswa = Mahasiswa::on('kkn')->updateOrCreate(
                        ['nim' => $nim],
                        [
                            'master_id' => (string) $studData['id'],
                            'user_id' => $user->id,
                            'nama' => $studData['nama'] ?? $studData['name'] ?? 'Unknown',
                            'faculty_id' => $defaultFaculty?->id,
                            'program_id' => $program->id,
                            'batch_year' => $studData['angkatan'] ?? $studData['batch_year'] ?? date('Y'),
                            'gender' => $studData['jenis_kelamin'] ?? $studData['gender'] ?? 'L',
                            'birth_place' => $studData['tempat_lahir'] ?? $studData['birth_place'] ?? null,
                            'birth_date' => $studData['tanggal_lahir'] ?? $studData['birth_date'] ?? null,

                            // PRD 5.2 Academic Data Integration
                            'total_sks' => (int) ($studData['total_sks'] ?? $studData['sks_lulus'] ?? 0),
                            'sks_completed' => (int) ($studData['sks_lulus'] ?? $studData['total_sks'] ?? 0),
                            'gpa' => (float) ($studData['ipk'] ?? $studData['gpa'] ?? 0),

                            'status_bta_ppi' => $studData['status_bta_ppi'] ?? 'BELUM_LULUS',
                            'semester' => (int) ($studData['semester'] ?? $studData['semester_aktif'] ?? 0),
                            'master_synced_at' => $now,
                        ]
                    );                    
                    if ($mahasiswa->wasRecentlyCreated) {
                        $stats['total_created']++;
                    } else {
                        $stats['total_updated']++;
                    }
                });

                if ($stats['total_fetched'] % 100 === 0) {
                    $this->info("    Processed {$stats['total_fetched']} students...");
                }
            } catch (\Exception $e) {
                $stats['total_errors']++;
                $errorDetails[] = ['nim' => $nim ?? 'unknown', 'error' => $e->getMessage()];
                Log::warning("Failed to sync student", ['nim' => $nim ?? 'unknown', 'error' => $e->getMessage()]);
            }
        }

        $endTime = now();
        $duration = $endTime->diffInSeconds($startTime);

        SyncLog::create([
            'sync_type' => $isDelta ? 'delta' : 'full',
            'entity_type' => 'mahasiswa',
            'status' => $stats['total_errors'] > 0 ? ($stats['total_updated'] + $stats['total_created'] > 0 ? 'partial_success' : 'failed') : 'success',
            'total_fetched' => $stats['total_fetched'],
            'total_created' => $stats['total_created'],
            'total_updated' => $stats['total_updated'],
            'total_skipped' => $stats['total_skipped'],
            'total_errors' => $stats['total_errors'],
            'error_details' => empty($errorDetails) ? null : $errorDetails,
            'duration_seconds' => $duration,
            'triggered_by' => app()->runningInConsole() ? 'artisan' : 'scheduler',
            'started_at' => $startTime,
            'finished_at' => $endTime,
        ]);
        
        SystemSetting::set('last_sync_mahasiswa', $now->toIso8601String());

        $this->info("  {$stats['total_fetched']} students synced ({$stats['total_created']} created, {$stats['total_updated']} updated) in {$duration}s");
    }
}
