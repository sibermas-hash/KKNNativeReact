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
use App\Services\MasterApi\MasterDataSanitizer;
use App\Services\MasterApi\SiakadRecordFilter;
use App\Services\MasterApiService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
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
        {--nim=* : Specific NIMs to sync (for mahasiswa only)}
        {--chunk-size=200 : Rows to process between throttle pauses (0 = no pause)}
        {--chunk-sleep-ms=0 : Milliseconds to sleep between chunks, to release CPU for PHP-FPM/Node. 200-500 is a safe starting point on a 2-4 core box}';

    protected $description = 'Sync identity data from Master API Service to KKN local database';

    protected MasterApiService $masterApi;

    public function __construct(MasterApiService $masterApi)
    {
        parent::__construct();
        $this->masterApi = $masterApi;
    }

    /**
     * Sleep briefly between chunks so a large sync run does not starve the
     * PHP-FPM pool or Node process on a 2-4 core box. Called from the two
     * processor loops (`processStudentsSync`, `processLecturersSync`) every
     * `--chunk-size` records.
     *
     * Tunable per-run:
     *   --chunk-size=200       (rows per chunk)
     *   --chunk-sleep-ms=250   (ms pause between chunks)
     *
     * Default: no pause, to stay backward-compatible with small syncs.
     */
    protected function maybeThrottleChunk(int $processed): void
    {
        $chunkSize = (int) $this->option('chunk-size');
        $sleepMs = (int) $this->option('chunk-sleep-ms');

        if ($chunkSize <= 0 || $sleepMs <= 0) {
            return;
        }

        if ($processed > 0 && $processed % $chunkSize === 0) {
            usleep($sleepMs * 1000);
        }
    }

    public function handle(): int
    {
        $lock = Cache::lock('sync:master-data:global', 7200);
        if (! $lock->get()) {
            $this->error('Sync lain sedang berjalan. Coba lagi setelah proses selesai.');

            return 1;
        }

        try {
            return $this->runLocked();
        } finally {
            optional($lock)->release();
        }
    }

    private function runLocked(): int
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
        }

        // ALWAYS verify database connection before writing
        try {
            DB::connection()->getPdo();
            $dbName = DB::connection()->getDatabaseName();
            $this->info("Database connection OK: {$dbName}");
        } catch (\Exception $e) {
            $this->error('Database connection failed: '.$e->getMessage());
            $this->error('Sync cannot proceed without a working database. Please check your .env DB_* settings and ensure PostgreSQL is running.');

            return 1;
        }

        // Verify migrations have been run by checking if core tables exist
        $requiredTables = ['fakultas', 'prodi', 'dosen', 'mahasiswa', 'users'];
        foreach ($requiredTables as $table) {
            if (! Schema::hasTable($table)) {
                $this->error("Table '{$table}' does not exist. Please run: php artisan migrate");

                return 1;
            }
        }
        $this->info('All required tables verified.');

        // Reset per-run data-quality counters so we can surface anomalies
        // (e.g. >1% GPA clamped) at the end of the run via Telegram alert.
        MasterDataSanitizer::resetStats();

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

            // Surface SIAKAD data-quality issues (e.g. IPK anomalies) to
            // ops via Telegram when the threshold is crossed. Silent
            // no-op otherwise.
            $qualityStats = MasterDataSanitizer::getStats();
            if ($qualityStats['gpa_clamped'] > 0) {
                $this->warn(sprintf(
                    '  Data quality: %d/%d GPA values clamped (%.2f%%) — see laravel log for details.',
                    $qualityStats['gpa_clamped'],
                    $qualityStats['gpa_processed'],
                    $qualityStats['gpa_clamp_ratio'] * 100,
                ));
            }
            MasterDataSanitizer::maybeAlertOps('sync:master-data');

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
        $this->info('Fetched '.count($orgs).' organizations from API.');
        if (count($orgs) > 0) {
            $this->info('First organization keys: '.implode(', ', array_keys($orgs[0])));
        }

        foreach ($orgs as $orgData) {
            try {
                $name = trim((string) ($orgData['name'] ?? $orgData['nama'] ?? ''));
                $apiId = $this->normalizeMasterId($orgData['id'] ?? null);

                // Use short_name as the primary code (most consistent field from API)
                // Fallback to code field, then to id field
                $shortName = trim((string) ($orgData['short_name'] ?? ''));
                $code = ! empty($shortName) ? $shortName : trim((string) ($orgData['code'] ?? $apiId ?? ''));

                if ($name === '' || $code === '') {
                    $stats['total_skipped']++;

                    continue;
                }

                $normalizedMasterId = $apiId ?? $code;

                $existingFaculty = Fakultas::where('master_id', $normalizedMasterId)->first();

                if ($existingFaculty) {
                    // Faculty exists - update it with the most consistent data
                    $existingFaculty->update([
                        'master_id' => $normalizedMasterId,
                        'code' => $code,
                        'short_name' => trim((string) ($orgData['short_name'] ?? '')),
                        'level' => isset($orgData['level']) ? (int) $orgData['level'] : null,
                        'master_synced_at' => $now,
                    ]);
                    $stats['total_updated']++;
                } else {
                    // Create new faculty
                    Fakultas::create([
                        'master_id' => $normalizedMasterId,
                        'code' => $code,
                        'nama' => $name,
                        'short_name' => trim((string) ($orgData['short_name'] ?? '')),
                        'level' => isset($orgData['level']) ? (int) $orgData['level'] : null,
                        'master_synced_at' => $now,
                    ]);
                    $stats['total_created']++;
                }
            } catch (\Exception $e) {
                $stats['total_errors']++;
                $errorDetails[] = ['id' => $orgData['id'] ?? 'unknown', 'error' => $e->getMessage()];
                Log::warning('Failed to sync faculty', ['id' => $orgData['id'] ?? 'unknown', 'error' => $e->getMessage()]);
            }
        }

        $endTime = now();
        $duration = (int) abs($endTime->diffInSeconds($startTime));

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

        if ($stats['total_errors'] === 0) {
            SystemSetting::set('last_sync_fakultas', $now->toIso8601String());
        }

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

        $facultyMap = $this->buildFacultyLookupMap();

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

                if (! $facultyId) {
                    throw new \RuntimeException('Master fakultas belum tersedia untuk pemetaan prodi.');
                }

                // CHECK JENJANG - Filter out S2/S3/Pasca programs (not eligible for KKN)
                $jenjang = trim((string) ($programData['jenjang'] ?? $programData['degree'] ?? ''));
                if ($this->isNonKknEligibleJenjang($jenjang)) {
                    $stats['total_skipped']++;
                    Log::info('Skipping non-KKN-eligible program', [
                        'name' => $name,
                        'jenjang' => $jenjang,
                        'reason' => 'Only S1 programs eligible for KKN',
                    ]);

                    continue;
                }

                $program = Prodi::updateOrCreate(
                    $masterId !== null ? ['master_id' => $masterId] : ['nama' => $name],
                    [
                        'fakultas_id' => $facultyId,
                        'code' => $this->resolveProgramCode($programData, $name),
                        'nama' => $name,
                        'short_name' => trim((string) ($programData['short_name'] ?? '')),
                        'jenjang' => trim((string) ($programData['jenjang'] ?? $programData['degree'] ?? '')),
                        'organization_id' => $facultyMasterId,
                        'is_kkn_eligible' => 1, // Flag that this program is eligible for KKN
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
        $duration = (int) abs($endTime->diffInSeconds($startTime));

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

        if ($stats['total_errors'] === 0) {
            SystemSetting::set('last_sync_program', $now->toIso8601String());
        }

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

        // Build faculty map for proper dosen→fakultas mapping
        $facultyMap = $this->buildFacultyLookupMap();

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

                // Log ALL fields from the first record so we can verify mapping
                if ($stats['total_fetched'] <= 1) {
                    // Audit follow-up: the old version logged the entire first
                    // record, which included nama, email, no_rekening, nama_bank.
                    // Now emit only the schema keys + a redacted mask of values
                    // — enough to diagnose mapping without shipping PII.
                    Log::info('DOSEN SYNC: First record schema (values redacted)', [
                        'keys' => array_keys($empData),
                        'has_fakultas_id' => ! empty($empData['fakultas_id'] ?? null),
                        'has_organization_id' => ! empty($empData['organization_id'] ?? null),
                        'has_email' => ! empty($empData['email'] ?? null),
                    ]);
                    $this->info('  First dosen raw keys: '.implode(', ', array_keys($empData)));
                }

                if (! $nip) {
                    $stats['total_skipped']++;

                    continue;
                }

                // Pre-DB filter for lecturers (config/siakad_filters.php).
                $decision = app(SiakadRecordFilter::class)->shouldSyncLecturer($empData);
                if ($decision['action'] !== SiakadRecordFilter::SYNC) {
                    $stats['total_skipped']++;
                    Log::info('SIAKAD lecturer filtered out before DB write', [
                        'nip' => $nip,
                        'reason' => $decision['reason'],
                        'detail' => $decision['details'],
                    ]);

                    continue;
                }

                // 1. Ensure User account exists
                $username = (string) $nip;
                $incomingEmail = $this->normalizeMasterEmail($empData['email'] ?? null);

                DB::transaction(function () use ($empData, $nip, $username, $incomingEmail, &$stats, $now, $facultyMap) {
                    // Field-lock registry — locked fields on existing Dosen
                    // must NOT be overwritten by SIAKAD sync. Loaded up-front
                    // so we can use it below when building $dosenUpdate.
                    $existingDosen = Dosen::whereBlind('nip', (string) $nip)->first();

                    // Upsert by username. Only persist a real Master email; keep null when absent/duplicate.
                    $user = User::firstOrNew(['username' => $username]);
                    $isNewUser = ! $user->exists;

                    if ($isNewUser) {
                        $emailToUse = null;
                        if (! empty($incomingEmail)) {
                            $emailTaken = User::where('email', $incomingEmail)
                                ->where('username', '!=', $username)
                                ->exists();
                            $emailToUse = $emailTaken ? null : $incomingEmail;
                        }
                        $user->email = $emailToUse;
                    } elseif (empty($user->email) && ! empty($incomingEmail)) {
                        $emailTaken = User::where('email', $incomingEmail)
                            ->where('username', '!=', $username)
                            ->exists();
                        if (! $emailTaken) {
                            $user->email = $incomingEmail;
                        }
                    }

                    $user->username = $username;
                    // name may be locked on existing accounts.
                    $candidateName = $empData['nama'] ?? $empData['name'] ?? 'Unknown';
                    if ($isNewUser || ! $user->isFieldLocked('name')) {
                        $user->name = $candidateName;
                    }

                    if ($isNewUser) {
                        // C-002 fix (also applies to this CLI path — earlier fix
                        // covered only WebhookController + StudentSyncService).
                        // New accounts get an unguessable random password; the
                        // user claims it via the password-reset flow.
                        $user->password = Hash::make(PasswordHelper::generateSecureDefault());
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

                    // Map dosen to proper fakultas from API data
                    $dosenOrgMasterId = $this->normalizeMasterId(
                        $empData['organization_id']
                        ?? $empData['fakultas_id']
                        ?? $empData['faculty_id']
                        ?? null
                    );
                    $dosenFakultasId = $dosenOrgMasterId !== null
                        ? ($facultyMap[$dosenOrgMasterId] ?? null)
                        : null;

                    // AUDIT FIX: "LB-*" (Luar Biasa / external) lecturers in
                    // SIAKAD legitimately have no fakultas assignment. Previously
                    // the sync hard-failed on this, which made the command
                    // unusable in production. Now allow null — the admin can
                    // assign a fakultas manually via the UI later. Only hard-fail
                    // when the API DID supply a fakultas_id but it's unmapped
                    // (that indicates a genuine data inconsistency).
                    if ($dosenOrgMasterId !== null && ! $dosenFakultasId) {
                        throw new \RuntimeException(
                            "SIAKAD reported fakultas_id={$dosenOrgMasterId} for dosen {$nip} ".
                            'but that id has no matching local fakultas. '.
                            'Run sync:master-data with the faculties step completed first, '.
                            'or add the missing fakultas record.'
                        );
                    }
                    // $dosenFakultasId may legitimately be null for external lecturers.

                    $dosenPayload = [
                        'master_id' => (string) $empData['id'],
                        'user_id' => $user->id,
                        'nama' => $empData['nama'] ?? $empData['name'] ?? 'Unknown',
                        'fakultas_id' => $dosenFakultasId,
                        'phone' => $empData['telepon'] ?? $empData['phone'] ?? null,
                        'gender' => $empData['jenis_kelamin'] ?? $empData['gender'] ?? 'L',
                        'birth_date' => $empData['tanggal_lahir'] ?? $empData['birth_date'] ?? null,
                        'is_cpns' => $isCpns,
                        'is_tugas_belajar' => $isTugasBelajar,
                        'jabatan' => $empData['jabatan'] ?? $empData['jabatan_fungsional'] ?? null,
                        'golongan' => $empData['golongan'] ?? $empData['pangkat_golongan'] ?? null,
                        'npwp' => $empData['npwp'] ?? null,
                        'status_aktif' => $empData['status_aktif'] ?? null,
                        'status_pegawai' => $empData['status_pegawai'] ?? null,
                        'no_rekening' => $empData['no_rekening'] ?? null,
                        'nama_bank' => $empData['nama_bank'] ?? null,
                        'master_synced_at' => $now,
                    ];

                    // Respect per-dosen field locks on existing records so admin
                    // edits don't get wiped by nightly sync.
                    if ($existingDosen) {
                        $dosenPayload = $existingDosen->filterLockedFields($dosenPayload);
                    }

                    $dosen = Dosen::updateOrCreate(
                        ['nip' => $nip],
                        $dosenPayload
                    );

                    if ($dosen->wasRecentlyCreated) {
                        $stats['total_created']++;
                    } else {
                        $stats['total_updated']++;
                    }

                    // C-002 follow-up: dispatch a reset link after the
                    // transaction commits so the user can claim the
                    // random-password account. Mirrors WebhookController.
                    if ($isNewUser && ! empty($user->email)) {
                        $userEmail = $user->email;
                        DB::afterCommit(function () use ($userEmail, $nip) {
                            try {
                                Password::sendResetLink(['email' => $userEmail]);
                            } catch (\Throwable $e) {
                                Log::warning('sync:master-data — reset-link dispatch failed', [
                                    'nip' => $nip, 'error' => $e->getMessage(),
                                ]);
                            }
                        });
                    }
                });

                if ($stats['total_fetched'] % 100 === 0) {
                    $this->info("    Processed {$stats['total_fetched']} lecturers...");
                }

                // CPU throttle — release the box between chunks so PHP-FPM
                // (serving Nginx → Laravel /api/*) and Node (Next.js) can
                // still respond. On production FreeBSD with 2-4 cores this
                // prevents the 503 Service Unavailable storm we saw during
                // the first 12k-student sync.
                $this->maybeThrottleChunk($stats['total_fetched']);
            } catch (\Exception $e) {
                $stats['total_errors']++;
                $errorDetails[] = ['nip' => $nip ?? 'unknown', 'error' => $e->getMessage()];
                $this->error("  FAIL lecturer NIP={$nip}: {$e->getMessage()}");
                Log::warning('Failed to sync lecturer', ['nip' => $nip ?? 'unknown', 'error' => $e->getMessage()]);
            }
        }

        $endTime = now();
        $duration = (int) abs($endTime->diffInSeconds($startTime));

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

        if ($stats['total_errors'] === 0) {
            SystemSetting::set('last_sync_dosen', $now->toIso8601String());
        }

        $this->info("  {$stats['total_fetched']} lecturers synced ({$stats['total_created']} created, {$stats['total_updated']} updated) in {$duration}s");
        if ($stats['total_skipped'] > 0) {
            $this->warn("  {$stats['total_skipped']} lecturer(s) filtered out (see Laravel log for reasons — config/siakad_filters.php governs this).");
        }
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
        $prodiMap = Prodi::pluck('id', 'master_id')->all();

        $this->info('Starting to process '.(is_countable($students) ? count($students) : 'generator').' students...');
        $processedCount = 0;

        foreach ($students as $stud) {
            $stats['total_fetched']++;
            $processedCount++;

            if ($processedCount <= 1) {
                $this->info('First student raw keys: '.implode(', ', array_keys((array) $stud)));
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

                // Log schema of the first record only (no PII — matches
                // the lecturer-sync diagnostic). Values are redacted.
                if ($stats['total_fetched'] <= 1) {
                    Log::info('MAHASISWA SYNC: First record schema (values redacted)', [
                        'keys' => array_keys($studData),
                        'has_nim' => ! empty($studData['nim'] ?? null),
                        'has_prodi_id' => ! empty($studData['prodi_id'] ?? null),
                    ]);
                    $this->info('  First mahasiswa raw keys: '.implode(', ', array_keys($studData)));
                }

                if (! $nim) {
                    $stats['total_skipped']++;

                    continue;
                }

                // Pre-DB filter for students (config/siakad_filters.php).
                $decision = app(SiakadRecordFilter::class)->shouldSyncStudent($studData);
                if ($decision['action'] !== SiakadRecordFilter::SYNC) {
                    $stats['total_skipped']++;
                    Log::info('SIAKAD mahasiswa filtered out before DB write', [
                        'nim' => $nim,
                        'reason' => $decision['reason'],
                        'detail' => $decision['details'],
                    ]);

                    continue;
                }

                // "Sudah KKN" freeze: once a mahasiswa has been accepted into
                // a KKN group, their SIBERMAS data is the final snapshot and
                // SIAKAD sync must not touch it. Mirrors StudentSyncService.
                $existingMhs = Mahasiswa::whereBlind('nim', (string) $nim)->first();
                if ($existingMhs && $existingMhs->hasEverBeenInKkn()) {
                    $stats['total_skipped']++;
                    Log::info('SIAKAD mahasiswa sync skipped — already in KKN', ['nim' => $nim]);

                    continue;
                }

                DB::transaction(function () use ($studData, $nim, $now, $prodiMap, &$stats, $existingMhs) {
                    $prodiName = $studData['prodi'] ?? 'Unknown Program';
                    $programMasterId = isset($studData['prodi_id']) ? (string) $studData['prodi_id'] : null;
                    $prodiId = $programMasterId !== null ? ($prodiMap[$programMasterId] ?? null) : null;

                    if ($stats['total_fetched'] <= 1) {
                        Log::debug('Processing first student', [
                            'nim' => $nim,
                            'prodi_id_from_api' => $programMasterId,
                            'prodi_id_mapped' => $prodiId,
                            'faculty_id_from_api' => $studData['fakultas_id'] ?? null,
                        ]);
                    }

                    if (! $prodiId) {
                        // When the non-KKN-jenjang filter is on, an unmapped
                        // prodi_id almost always means the prodi is S2/S3/Pasca
                        // and was intentionally skipped at the prodi sync step.
                        // Treat that as a soft skip rather than a hard error —
                        // otherwise every S2 student inflates total_errors and
                        // triggers false alarms in ops dashboards.
                        if ((bool) config('siakad_filters.students.skip_non_kkn_jenjang', true)) {
                            Log::info('SIAKAD mahasiswa skipped — prodi not in local DB (likely graduate program)', [
                                'nim' => $nim,
                                'prodi_master_id' => $programMasterId,
                            ]);
                            $stats['total_skipped']++;

                            return;
                        }

                        throw new \RuntimeException("Master prodi belum tersedia untuk mahasiswa {$nim} (prodi_id={$programMasterId}).");
                    }

                    // CHECK: Skip students from non-KKN-eligible prodi (S2/S3/Pasca)
                    $prodiRecord = Prodi::find($prodiId);
                    if ($prodiRecord && $this->isNonKknEligibleJenjang($prodiRecord->jenjang)) {
                        Log::info('Skipping student from non-KKN-eligible prodi', [
                            'nim' => $nim,
                            'nama' => $studData['nama'] ?? 'Unknown',
                            'prodi' => $prodiRecord->nama,
                            'jenjang' => $prodiRecord->jenjang,
                            'reason' => 'Only S1 students eligible for KKN',
                        ]);
                        $stats['total_skipped']++;

                        return; // Skip this transaction
                    }

                    // ENSURE CONSISTENCY: Always use fakultas_id from prodi, not from API data.
                    $prodiRecord = Prodi::find($prodiId);
                    if (! $prodiRecord) {
                        throw new \RuntimeException("Prodi lokal tidak ditemukan untuk mahasiswa {$nim} (prodi_id={$prodiId}).");
                    }
                    $facultyId = $prodiRecord->fakultas_id;

                    $username = (string) $nim;
                    $incomingEmail = $this->normalizeMasterEmail($studData['email'] ?? null);

                    $user = User::firstOrNew(['username' => $username]);
                    $isNewUser = ! $user->exists;

                    $birthDateDefaultPassword = PasswordHelper::fromBirthDate($studData['tanggal_lahir'] ?? $studData['birth_date'] ?? null);

                    if ($isNewUser) {
                        $emailToUse = null;
                        if (! empty($incomingEmail)) {
                            $emailTaken = User::where('email', $incomingEmail)
                                ->where('username', '!=', $username)
                                ->exists();
                            $emailToUse = $emailTaken ? null : $incomingEmail;
                        }
                        $user->email = $emailToUse;
                        $defaultPassword = $birthDateDefaultPassword ?? PasswordHelper::generateSecureDefault();
                        $user->password = Hash::make($defaultPassword);
                        $user->must_change_password = true;
                    } elseif (empty($user->email) && ! empty($incomingEmail)) {
                        $emailTaken = User::where('email', $incomingEmail)
                            ->where('username', '!=', $username)
                            ->exists();
                        if (! $emailTaken) {
                            $user->email = $incomingEmail;
                        }
                    }

                    if (! $isNewUser && $birthDateDefaultPassword && ($user->must_change_password || is_null($user->password_changed_at))) {
                        $user->password = Hash::make($birthDateDefaultPassword);
                        $user->must_change_password = true;
                    }

                    $user->username = $username;
                    // Respect lock: admin/mahasiswa may have corrected
                    // typo'd SIAKAD name.
                    $candidateName = $studData['nama'] ?? $studData['name'] ?? 'Unknown';
                    if ($isNewUser || ! $user->isFieldLocked('name')) {
                        $user->name = $candidateName;
                    }
                    $user->save();

                    if (! $user->hasRole('student')) {
                        $user->assignRole('student');
                    }

                    $mahasiswaPayload = [
                        'master_id' => (string) $studData['id'],
                        'user_id' => $user->id,
                        'nim' => $nim,
                        'nik' => MasterDataSanitizer::nik($studData['nik'] ?? null, $nim),
                        'nama' => $studData['nama'] ?? $studData['name'] ?? 'Unknown',
                        'mother_name' => $studData['nama_ibu'] ?? $studData['mother_name'] ?? null,
                        'fakultas_id' => $facultyId,
                        'prodi_id' => $prodiId,
                        'batch_year' => $studData['angkatan'] ?? $studData['batch_year'] ?? date('Y'),
                        'gender' => $studData['jenis_kelamin'] ?? $studData['gender'] ?? 'L',
                        'birth_place' => $studData['tempat_lahir'] ?? $studData['birth_place'] ?? null,
                        'birth_date' => $studData['tanggal_lahir'] ?? $studData['birth_date'] ?? null,
                        'alamat' => $studData['alamat'] ?? null,
                        'phone' => $studData['phone'] ?? $studData['telepon'] ?? null,

                        'sks_completed' => (int) ($studData['total_sks'] ?? $studData['sks_lulus'] ?? $studData['sks_completed'] ?? 0),
                        'gpa' => MasterDataSanitizer::gpa($studData['ipk'] ?? $studData['gpa'] ?? null, $nim),

                        'status_bta_ppi' => $studData['status_bta_ppi'] ?? 'BELUM_LULUS',
                        'status_aktif' => $studData['status_aktif'] ?? null,
                        'is_paid_ukt' => (bool) ($studData['is_paid_ukt'] ?? false),
                        'semester' => (int) ($studData['semester'] ?? $studData['semester_aktif'] ?? 0),
                        'master_synced_at' => $now,
                    ];

                    // Respect field locks on existing mahasiswa.
                    if ($existingMhs) {
                        $mahasiswaPayload = $existingMhs->filterLockedFields($mahasiswaPayload);
                    }

                    $mahasiswa = Mahasiswa::updateOrCreate(
                        ['nim' => $nim],
                        $mahasiswaPayload
                    );

                    if ($mahasiswa->wasRecentlyCreated) {
                        $stats['total_created']++;
                    } else {
                        $stats['total_updated']++;
                    }

                    // C-002 follow-up: reset-link dispatch for new student
                    // accounts, deferred to after-commit.
                    if ($isNewUser && ! empty($user->email)) {
                        $userEmail = $user->email;
                        DB::afterCommit(function () use ($userEmail, $nim) {
                            try {
                                Password::sendResetLink(['email' => $userEmail]);
                            } catch (\Throwable $e) {
                                Log::warning('sync:master-data — student reset-link dispatch failed', [
                                    'nim' => $nim, 'error' => $e->getMessage(),
                                ]);
                            }
                        });
                    }
                });

                if ($stats['total_fetched'] % 100 === 0) {
                    $this->info("    Processed {$stats['total_fetched']} students...");
                }

                // CPU throttle — see comment in processLecturersSync.
                $this->maybeThrottleChunk($stats['total_fetched']);
            } catch (\Exception $e) {
                $stats['total_errors']++;
                $errorDetails[] = ['nim' => $nim ?? 'unknown', 'error' => $e->getMessage()];
                $this->error("  FAIL student NIM={$nim}: {$e->getMessage()}");
                Log::warning('Failed to sync student', ['nim' => $nim ?? 'unknown', 'error' => $e->getMessage()]);
            }
        }

        $endTime = now();
        $duration = (int) abs($endTime->diffInSeconds($startTime));

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

        if ($stats['total_errors'] === 0) {
            SystemSetting::set('last_sync_mahasiswa', $now->toIso8601String());
        }

        $this->info("  {$stats['total_fetched']} students synced ({$stats['total_created']} created, {$stats['total_updated']} updated) in {$duration}s");
        if ($stats['total_skipped'] > 0) {
            $this->warn("  {$stats['total_skipped']} student(s) filtered out (see Laravel log for reasons — config/siakad_filters.php governs this).");
        }
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

    private function normalizeMasterEmail(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $email = trim((string) $value);
        if ($email === '' || str_ends_with(strtolower($email), '@kkn.local')) {
            return null;
        }

        return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : null;
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
            return $masterId ? 'PR-'.$masterId : 'PRODI-'.Str::random(4);
        }

        return $cleanName;
    }

    /**
     * Master API uses multiple aliases for the same faculty. Keep all aliases valid
     * for mapping while still storing only one faculty row per name.
     *
     * @return array<string, int>
     */
    private function buildFacultyLookupMap(): array
    {
        $map = [];

        Fakultas::query()
            ->select(['id', 'master_id', 'code', 'short_name'])
            ->get()
            ->each(function (Fakultas $faculty) use (&$map) {
                foreach ([$faculty->master_id, $faculty->code, $faculty->short_name] as $key) {
                    $key = $this->normalizeMasterId($key);
                    if ($key !== null) {
                        $map[$key] = $faculty->id;
                    }
                }
            });

        return $map;
    }

    private function isNonKknEligibleJenjang(string $jenjang): bool
    {
        // Programs that are NOT eligible for KKN
        $nonEligibleJenjangs = ['S2', 'S3', 'Magister', 'Doktor', 'Pasca', 'Pascasarjana'];
        $jenjang = trim(strtoupper($jenjang));

        // Check if jenjang is in non-eligible list
        foreach ($nonEligibleJenjangs as $nonEligible) {
            if (str_contains($jenjang, strtoupper($nonEligible))) {
                return true;
            }
        }

        return false;
    }
}
