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
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\Console\Attribute\AsCommand;

#[AsCommand(name: 'sync:master-data')]
class SyncMasterData extends Command
{
    protected $signature = 'sync:master-data
        {--type=all : Type of data to sync (all, mahasiswa, dosen, fakultas/faculty, program/prodi)}
        {--source=api : Source of data (api or db)}
        {--delta : Run a delta sync based on last sync time}
        {--force : Force sync even if cache is fresh}
        {--nim=* : Specific NIMs to sync (for mahasiswa only)}';

    protected $description = 'Sync identity data from Master API Service to KKN local database';

    protected MasterApiService $masterApi;

    public function __construct(MasterApiService $masterApi)
    {
        parent::__construct();
        $this->masterApi = $masterApi;
    }

    public function handle(): int
    {
        $type = $this->normalizeSyncType((string) $this->option('type'));

        if ($type === null) {
            $this->error('Tipe sync tidak dikenali. Gunakan: all, mahasiswa, dosen, fakultas/faculty, program/prodi.');

            return 1;
        }

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
            $this->info('Syncing directly from database (using default connection)');
            try {
                DB::connection()->getPdo();
                $this->info('Database connection is UP');
            } catch (\Exception $e) {
                $this->error('Database connection failed: '.$e->getMessage());

                return 1;
            }
        }

        // REMOVED: DB::beginTransaction() at global level to prevent long-running mass locks
        // We will use individual transactions or direct writes per record for stability

        try {
            if (in_array($type, ['all', 'fakultas'])) {
                $this->syncFaculties();
            }

            if (in_array($type, ['all', 'program'])) {
                $this->syncPrograms();
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
        $since = $isDelta ? SystemSetting::get('last_sync_fakultas', now()->subDay()->toIso8601String()) : null;

        if ($source === 'api') {
            // Usually organizations are small, so we fetch all, but PRD asks for consistency
            $orgs = $this->masterApi->getAllOrganizations($since);
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
        $this->info("Fetched " . count($orgs) . " organizations from API.");
        if (count($orgs) > 0) {
            $this->info("Sample data: " . json_encode($orgs[0]));
        }

        foreach ($orgs as $orgData) {
            try {
                $name = trim((string) ($orgData['name'] ?? $orgData['nama'] ?? ''));
                $code = trim((string) ($orgData['code'] ?? $orgData['id'] ?? ''));

                if ($name === '' || $code === '') {
                    $stats['total_skipped']++;

                    continue;
                }

                // If name is "Default Faculty" or contains "Fakultas" or level 2
                $isFaculty = str_contains(strtolower($name), 'fakultas') 
                    || (int) ($orgData['level'] ?? 0) === 2
                    || $name === 'Default Faculty';

                if ($isFaculty) {
                    $faculty = Fakultas::updateOrCreate(
                        ['master_id' => $this->normalizeMasterId($orgData['id'] ?? null) ?? $code],
                        [
                            'code' => $code,
                            'nama' => $name,
                            'short_name' => trim((string) ($orgData['short_name'] ?? '')),
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
                Log::warning('Failed to sync faculty', ['id' => $orgData['id'] ?? 'unknown', 'error' => $e->getMessage()]);
            }
        }

        $endTime = now();
        $duration = (int) $endTime->diffInSeconds($startTime);

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

        SystemSetting::set('last_sync_fakultas', $now->toIso8601String());

        $this->info("  {$stats['total_fetched']} organizations processed ({$stats['total_created']} faculties created, {$stats['total_updated']} updated)");
    }

    protected function syncPrograms(): void
    {
        $this->info('Syncing study programs...');

        $startTime = now();
        $isDelta = (bool) $this->option('delta');
        $source = (string) $this->option('source');
        $since = $isDelta ? SystemSetting::get('last_sync_program', now()->subDay()->toIso8601String()) : null;

        if ($source === 'api') {
            $programs = $this->masterApi->yieldAllPrograms($since);
        } else {
            $this->warn('  Direct DB sync for programs is not implemented yet. Use API source.');

            return;
        }

        $stats = [
            'total_fetched' => 0,
            'total_created' => 0,
            'total_updated' => 0,
            'total_skipped' => 0,
            'total_errors' => 0,
        ];
        $errorDetails = [];
        $now = now();

        $defaultFaculty = Fakultas::orderBy('id')->first();
        if (! $defaultFaculty) {
            $defaultFaculty = Fakultas::create([
                'code' => 'DEFAULT',
                'nama' => 'Default Faculty',
                'master_id' => '0',
                'master_synced_at' => $now,
            ]);
            $this->info('  Created Default Faculty as fallback for programs');
        }

        $facultyMap = Fakultas::pluck('id', 'master_id')->all();

        foreach ($programs as $programData) {
            $stats['total_fetched']++;

            try {
                $name = trim((string) ($programData['name'] ?? $programData['nama'] ?? ''));
                if ($name === '') {
                    $stats['total_skipped']++;

                    continue;
                }

                $masterId = $this->normalizeMasterId($programData['id'] ?? $programData['master_id'] ?? null);
                $facultyMasterId = $this->normalizeMasterId(
                    $programData['organization_id']
                    ?? $programData['faculty_id']
                    ?? $programData['fakultas_id']
                    ?? null
                );
                $facultyId = $facultyMasterId !== null ? ($facultyMap[$facultyMasterId] ?? null) : null;
                $facultyId ??= $defaultFaculty?->id;

                if (! $facultyId) {
                    throw new \RuntimeException('Master fakultas belum tersedia untuk pemetaan prodi.');
                }

                $program = Prodi::updateOrCreate(
                    $masterId !== null ? ['master_id' => $masterId] : ['nama' => $name],
                    [
                        'fakultas_id' => $facultyId,
                        'code' => $this->resolveProgramCode($programData, $name),
                        'nama' => $name,
                        'short_name' => trim((string) ($programData['short_name'] ?? '')),
                        'jenjang' => trim((string) ($programData['jenjang'] ?? '')),
                        'master_synced_at' => $now,
                    ]
                );

                if ($program->wasRecentlyCreated) {
                    $stats['total_created']++;
                } else {
                    $stats['total_updated']++;
                }
            } catch (\Exception $e) {
                $stats['total_errors']++;
                $errorDetails[] = [
                    'id' => $programData['id'] ?? 'unknown',
                    'name' => $programData['name'] ?? $programData['nama'] ?? 'unknown',
                    'error' => $e->getMessage(),
                ];
                Log::warning('Failed to sync program', [
                    'id' => $programData['id'] ?? 'unknown',
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $endTime = now();
        $duration = (int) $endTime->diffInSeconds($startTime);

        SyncLog::create([
            'sync_type' => $isDelta ? 'delta' : 'full',
            'entity_type' => 'program',
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

        SystemSetting::set('last_sync_program', $now->toIso8601String());

        $this->info("  {$stats['total_fetched']} programs synced ({$stats['total_created']} created, {$stats['total_updated']} updated) in {$duration}s");
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
            $employees = MasterLecturer::when($isDelta && $since, fn ($q) => $q->where('updated_at', '>=', $since))->cursor();
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
        $defaultFaculty = Fakultas::orderBy('id')->first();
        if (! $defaultFaculty) {
            $defaultFaculty = Fakultas::create([
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
                    // Upsert by username. Jika user belum ada, coba pakai email dari API.
                    // Jika email sudah dipakai user lain (duplicate), gunakan fallback @kkn.local.
                    $user = User::firstOrNew(['username' => $username]);
                    $isNewUser = ! $user->exists;

                    if ($isNewUser) {
                        $emailToUse = $fallbackEmail;
                        if (! empty($incomingEmail)) {
                            $emailTaken = User::where('email', $incomingEmail)
                                ->where('username', '!=', $username)
                                ->exists();
                            $emailToUse = $emailTaken ? $fallbackEmail : $incomingEmail;
                        }
                        $user->email = $emailToUse;
                    } elseif (empty($user->email)) {
                        $user->email = $fallbackEmail;
                    }

                    $user->username = $username;
                    $user->name = $empData['nama'] ?? $empData['name'] ?? 'Unknown';

                    if ($isNewUser) {
                        $birthDate = $empData['tanggal_lahir'] ?? $empData['birth_date'] ?? null;
                        $user->password = Hash::make(
                            PasswordHelper::fromBirthDate($birthDate, $username)
                        );
                        $user->must_change_password = true;
                    }

                    $user->save();

                    if (! $user->hasRole('dosen')) {
                        $user->assignRole('dosen');
                    }

                    $statusPegawai = strtoupper($empData['status_pegawai'] ?? $empData['employment_status'] ?? '');
                    $isCpns = str_contains($statusPegawai, 'CPNS');

                    $statusAktif = strtoupper($empData['status_aktif'] ?? $empData['active_status'] ?? 'AKTIF');
                    $isTugasBelajar = str_contains($statusAktif, 'TUGAS BELAJAR') || ($empData['is_tugas_belajar'] ?? false);

                    $dosen = Dosen::updateOrCreate(
                        ['nip' => $nip],
                        [
                            'master_id' => (string) $empData['id'],
                            'user_id' => $user->id,
                            'nama' => $empData['nama'] ?? $empData['name'] ?? 'Unknown',
                            'fakultas_id' => $defaultFaculty?->id,
                            'phone' => $empData['telepon'] ?? $empData['phone'] ?? null,
                            'gender' => $empData['jenis_kelamin'] ?? $empData['gender'] ?? 'L',
                            'birth_date' => $empData['tanggal_lahir'] ?? $empData['birth_date'] ?? null,
                            'is_cpns' => $isCpns,
                            'is_tugas_belajar' => $isTugasBelajar,
                            'status_aktif' => $empData['status_aktif'] ?? null,
                            'status_pegawai' => $empData['status_pegawai'] ?? null,
                            'no_rekening' => $empData['no_rekening'] ?? null,
                            'nama_bank' => $empData['nama_bank'] ?? null,
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
                Log::warning('Failed to sync lecturer', ['nip' => $nip ?? 'unknown', 'error' => $e->getMessage()]);
            }
        }

        $endTime = now();
        $duration = (int) $endTime->diffInSeconds($startTime);

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
        $nimList = $this->option('nim');

        if (! empty($nimList)) {
            $this->info('  Syncing specific NIMs: '.implode(', ', $nimList));
            $students = $this->masterApi->getStudentsByNimList($nimList);
        } elseif ($source === 'api') {
            $since = $isDelta ? SystemSetting::get('last_sync_mahasiswa', now()->subDay()->toIso8601String()) : null;
            $students = $this->masterApi->yieldSyncMahasiswa($since);
        } else {
            $since = $isDelta ? SystemSetting::get('last_sync_mahasiswa', now()->subDay()->toIso8601String()) : null;
            $students = MasterStudent::when($isDelta && $since, fn ($q) => $q->where('updated_at', '>=', $since))->cursor();
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
        $defaultFaculty = Fakultas::orderBy('id')->first();
        if (! $defaultFaculty) {
            $defaultFaculty = Fakultas::create([
                'code' => 'DEFAULT',
                'nama' => 'Default Faculty',
                'master_id' => '0',
                'master_synced_at' => $now,
            ]);
            $this->info('  Created Default Faculty as fallback');
        }

        $facultyMap = Fakultas::pluck('id', 'master_id')->all();
        $prodiMap = Prodi::pluck('id', 'master_id')->all();

        $this->info("Starting to process " . (is_countable($students) ? count($students) : "generator") . " students...");
        $processedCount = 0;

        foreach ($students as $stud) {
            $stats['total_fetched']++;
            $processedCount++;
            
            if ($processedCount <= 1) {
                $this->info("First student raw data: " . json_encode($stud));
            }

            try {
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
                    'sks_completed' => $stud->total_sks ?? $stud->sks_completed ?? 0,
                    'status_bta_ppi' => $stud->status_bta_ppi ?? 'BELUM_LULUS',
                    'semester' => $stud->semester ?? null,
                ] : $stud;

                $nim = $studData['nim'] ?? null;
                if (! $nim) {
                    $stats['total_skipped']++;

                    continue;
                }

                DB::transaction(function () use ($studData, $nim, $now, $defaultFaculty, $facultyMap, $prodiMap, &$stats) {
                    $prodiName = $studData['prodi'] ?? 'Unknown Program';
                    $programMasterId = isset($studData['prodi_id']) ? (string) $studData['prodi_id'] : null;
                    $prodiId = $programMasterId !== null ? ($prodiMap[$programMasterId] ?? null) : null;

                    if ($stats['total_fetched'] <= 1) {
                        Log::debug("Processing first student", [
                            'nim' => $nim,
                            'prodi_id_from_api' => $programMasterId,
                            'prodi_id_mapped' => $prodiId,
                            'faculty_id_from_api' => $studData['fakultas_id'] ?? null,
                        ]);
                    }

                    if (! $prodiId) {
                        $program = Prodi::firstOrCreate(
                            $programMasterId ? ['master_id' => $programMasterId] : ['nama' => $prodiName],
                            [
                                'code' => $this->resolveProgramCode($studData, $prodiName),
                                'nama' => $prodiName,
                                'fakultas_id' => $defaultFaculty?->id,
                                'master_synced_at' => $now,
                            ]
                        );
                        $prodiId = $program->id;
                    }

                    $organizationMasterId = isset($studData['fakultas_id']) ? (string) $studData['fakultas_id'] : (isset($studData['organization_id']) ? (string) $studData['organization_id'] : null);
                    $facultyId = $organizationMasterId !== null ? ($facultyMap[$organizationMasterId] ?? null) : null;

                    $username = (string) $nim;
                    $incomingEmail = $studData['email'] ?? null;
                    $fallbackEmail = $username.'@kkn.local';

                    $user = User::firstOrNew(['username' => $username]);
                    $isNewUser = ! $user->exists;

                    if ($isNewUser) {
                        $emailToUse = $fallbackEmail;
                        if (! empty($incomingEmail)) {
                            $emailTaken = User::where('email', $incomingEmail)
                                ->where('username', '!=', $username)
                                ->exists();
                            $emailToUse = $emailTaken ? $fallbackEmail : $incomingEmail;
                        }
                        $user->email = $emailToUse;
                        $user->password = Hash::make(Str::random(12));
                        $user->must_change_password = true;
                    } elseif (empty($user->email)) {
                        $user->email = $fallbackEmail;
                    }

                    $user->username = $username;
                    $user->name = $studData['nama'] ?? $studData['name'] ?? 'Unknown';
                    $user->save();

                    if (! $user->hasRole('student')) {
                        $user->assignRole('student');
                    }

                    $mahasiswa = Mahasiswa::updateOrCreate(
                        ['nim' => $nim],
                        [
                            'master_id' => (string) $studData['id'],
                            'user_id' => $user->id,
                            'nim' => $nim,
                            'nik' => $studData['nik'] ?? null,
                            'nama' => $studData['nama'] ?? $studData['name'] ?? 'Unknown',
                            'fakultas_id' => $facultyId ?? $defaultFaculty?->id,
                            'prodi_id' => $prodiId,
                            'batch_year' => $studData['angkatan'] ?? $studData['batch_year'] ?? date('Y'),
                            'gender' => $studData['jenis_kelamin'] ?? $studData['gender'] ?? 'L',
                            'birth_place' => $studData['tempat_lahir'] ?? $studData['birth_place'] ?? null,
                            'birth_date' => $studData['tanggal_lahir'] ?? $studData['birth_date'] ?? null,
                            'alamat' => $studData['alamat'] ?? null,
                            'phone' => $studData['phone'] ?? $studData['telepon'] ?? null,

                            'sks_completed' => (int) ($studData['total_sks'] ?? $studData['sks_lulus'] ?? $studData['sks_completed'] ?? 0),
                            'gpa' => (float) ($studData['ipk'] ?? $studData['gpa'] ?? 0),

                            'status_bta_ppi' => $studData['status_bta_ppi'] ?? 'BELUM_LULUS',
                            'status_aktif' => $studData['status_aktif'] ?? null,
                            'is_paid_ukt' => (bool) ($studData['is_paid_ukt'] ?? false),
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
                Log::warning('Failed to sync student', ['nim' => $nim ?? 'unknown', 'error' => $e->getMessage()]);
            }
        }

        $endTime = now();
        $duration = (int) $endTime->diffInSeconds($startTime);

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

    private function normalizeSyncType(string $type): ?string
    {
        return match (strtolower(trim($type))) {
            'all' => 'all',
            'mahasiswa' => 'mahasiswa',
            'dosen' => 'dosen',
            'faculty', 'fakultas' => 'fakultas',
            'program', 'prodi' => 'program',
            default => null,
        };
    }

    private function normalizeMasterId(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $normalized = trim((string) $value);

        return $normalized === '' ? null : $normalized;
    }

    private function resolveProgramCode(array $programData, string $programName): string
    {
        $incoming = trim((string) ($programData['code'] ?? $programData['kode'] ?? ''));
        if ($incoming !== '') {
            return $incoming;
        }

        // Gunakan prodi_id/master_id sebagai code, bukan 'id' (yang bisa berisi student id)
        $masterId = $this->normalizeMasterId(
            $programData['prodi_id'] ?? $programData['master_id'] ?? $programData['program_id'] ?? null
        );
        $cleanName = Str::upper((string) Str::of($programName)->ascii()->replaceMatches('/[^A-Za-z0-9]/', '')->substr(0, 10));

        if ($cleanName === '' || $cleanName === 'UNKNOWNPRO') {
            return $masterId ? 'PR-' . $masterId : 'PRODI-' . Str::random(4);
        }

        return $cleanName;
    }
}
