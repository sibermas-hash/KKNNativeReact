<?php

declare(strict_types=1);

namespace App\Services\MasterApi;

use App\Models\KKN\Prodi;

/**
 * Pre-DB filter for SIAKAD sync records.
 *
 * Single decision point: should this incoming record be persisted, and if
 * not, why. Callers (sync command, webhook, job) translate FilterResult
 * into per-entity stats + logs.
 *
 * Configured by config/siakad_filters.php, which is fully env-overridable
 * so ops can tune acceptance without redeploying.
 */
class SiakadRecordFilter
{
    public const SYNC = 'sync';

    // student reasons
    public const SKIP_STUDENT_BATCH_TOO_OLD = 'skip_student_batch_too_old';
    public const SKIP_STUDENT_BATCH_FUTURE = 'skip_student_batch_future';
    public const SKIP_STUDENT_INACTIVE = 'skip_student_inactive';
    public const SKIP_STUDENT_GRADUATE_PROGRAM = 'skip_student_graduate_program';
    public const SKIP_STUDENT_NO_NIK = 'skip_student_no_nik';
    public const SKIP_STUDENT_BLOCKLISTED = 'skip_student_blocklisted';
    public const SKIP_STUDENT_NO_NIM = 'skip_student_no_nim';

    // lecturer reasons
    public const SKIP_LECTURER_INACTIVE = 'skip_lecturer_inactive';
    public const SKIP_LECTURER_TUGAS_BELAJAR = 'skip_lecturer_tugas_belajar';
    public const SKIP_LECTURER_BLOCKLISTED = 'skip_lecturer_blocklisted';
    public const SKIP_LECTURER_NO_NIP = 'skip_lecturer_no_nip';

    private array $studentCfg;
    private array $lecturerCfg;
    private bool $enabled;

    /** @var array<int,string>|null cached non-eligible prodi ids */
    private ?array $nonKknProdiIds = null;

    public function __construct()
    {
        $this->studentCfg = (array) config('siakad_filters.students', []);
        $this->lecturerCfg = (array) config('siakad_filters.lecturers', []);
        $this->enabled = (bool) config('siakad_filters.enabled', true);
    }

    /**
     * Decide whether a mahasiswa record should be synced.
     *
     * @return array{action:string, reason:?string, details:array}
     */
    public function shouldSyncStudent(array $record): array
    {
        if (! $this->enabled) {
            return $this->allow();
        }

        $nim = trim((string) ($record['nim'] ?? ''));
        if ($nim === '') {
            return $this->skip(self::SKIP_STUDENT_NO_NIM, ['record_id' => $record['id'] ?? null]);
        }

        // Blocklist
        $blocklist = $this->studentCfg['blocklist_nim'] ?? [];
        if (in_array($nim, $blocklist, true)) {
            return $this->skip(self::SKIP_STUDENT_BLOCKLISTED, ['nim' => $nim]);
        }

        // Batch year lower bound
        $batchYear = (int) ($record['batch_year'] ?? $record['angkatan'] ?? 0);
        $minYear = (int) ($this->studentCfg['min_batch_year'] ?? 0);
        if ($minYear > 0 && $batchYear > 0 && $batchYear < $minYear) {
            return $this->skip(self::SKIP_STUDENT_BATCH_TOO_OLD, [
                'nim' => $nim, 'batch_year' => $batchYear, 'min' => $minYear,
            ]);
        }

        // Batch year upper bound
        $maxOffset = (int) ($this->studentCfg['max_batch_year_offset'] ?? 1);
        $maxYear = ((int) date('Y')) + max(0, $maxOffset);
        if ($batchYear > 0 && $batchYear > $maxYear) {
            return $this->skip(self::SKIP_STUDENT_BATCH_FUTURE, [
                'nim' => $nim, 'batch_year' => $batchYear, 'max' => $maxYear,
            ]);
        }

        // Active status
        $allowed = array_map('strtolower', (array) ($this->studentCfg['allowed_status_aktif'] ?? []));
        if (! empty($allowed)) {
            $status = strtolower(trim((string) ($record['status_aktif'] ?? '')));
            if ($status !== '' && ! in_array($status, $allowed, true)) {
                return $this->skip(self::SKIP_STUDENT_INACTIVE, [
                    'nim' => $nim, 'status' => $record['status_aktif'] ?? null,
                ]);
            }
        }

        // Graduate-program filter
        if ($this->studentCfg['skip_non_kkn_jenjang'] ?? false) {
            // 1) Trust the payload itself if it carries a jenjang/degree hint.
            //    This is the most reliable signal when available — doesn't
            //    depend on the local prodi table being synced yet.
            $payloadJenjang = trim((string) (
                $record['jenjang']
                ?? $record['degree']
                ?? $record['program_degree']
                ?? $record['prodi_jenjang']
                ?? ''
            ));
            if ($payloadJenjang !== '' && $this->jenjangIsGraduateProgram($payloadJenjang)) {
                return $this->skip(self::SKIP_STUDENT_GRADUATE_PROGRAM, [
                    'nim' => $nim, 'jenjang' => $payloadJenjang, 'source' => 'payload',
                ]);
            }

            // 2) Fall back to the local prodi table via master_id.
            $prodiMasterId = trim((string) ($record['prodi_id'] ?? ''));
            if ($prodiMasterId !== '' && $this->prodiIsGraduateProgram($prodiMasterId)) {
                return $this->skip(self::SKIP_STUDENT_GRADUATE_PROGRAM, [
                    'nim' => $nim, 'prodi_master_id' => $prodiMasterId, 'source' => 'local_prodi',
                ]);
            }
        }

        // Strict NIK mode
        if ($this->studentCfg['require_valid_nik'] ?? false) {
            $nik = trim((string) ($record['nik'] ?? ''));
            if (! preg_match('/^\d{16}$/', $nik)) {
                return $this->skip(self::SKIP_STUDENT_NO_NIK, [
                    'nim' => $nim, 'nik_len' => strlen($nik),
                ]);
            }
        }

        return $this->allow();
    }

    /**
     * Decide whether a dosen record should be synced.
     *
     * @return array{action:string, reason:?string, details:array}
     */
    public function shouldSyncLecturer(array $record): array
    {
        if (! $this->enabled) {
            return $this->allow();
        }

        $nip = trim((string) ($record['nip'] ?? ''));
        if ($nip === '') {
            return $this->skip(self::SKIP_LECTURER_NO_NIP, ['record_id' => $record['id'] ?? null]);
        }

        $blocklist = $this->lecturerCfg['blocklist_nip'] ?? [];
        if (in_array($nip, $blocklist, true)) {
            return $this->skip(self::SKIP_LECTURER_BLOCKLISTED, ['nip' => $nip]);
        }

        // Active status — case-insensitive
        $allowed = array_map('strtolower', (array) ($this->lecturerCfg['allowed_status_aktif'] ?? []));
        if (! empty($allowed)) {
            $status = strtolower(trim((string) ($record['status_aktif'] ?? '')));
            if ($status !== '' && ! in_array($status, $allowed, true)) {
                return $this->skip(self::SKIP_LECTURER_INACTIVE, [
                    'nip' => $nip, 'status' => $record['status_aktif'] ?? null,
                ]);
            }
        }

        // Tugas belajar = lecturer currently studying
        if ($this->lecturerCfg['skip_tugas_belajar'] ?? true) {
            $isTB = $this->fieldTrue($record, ['is_tugas_belajar'])
                || str_contains(strtoupper((string) ($record['status_aktif'] ?? '')), 'TUGAS BELAJAR');
            if ($isTB) {
                return $this->skip(self::SKIP_LECTURER_TUGAS_BELAJAR, ['nip' => $nip]);
            }
        }

        return $this->allow();
    }

    /** @return array{action:string, reason:null, details:array} */
    private function allow(): array
    {
        return ['action' => self::SYNC, 'reason' => null, 'details' => []];
    }

    /** @return array{action:string, reason:string, details:array} */
    private function skip(string $reason, array $details = []): array
    {
        return ['action' => 'skip', 'reason' => $reason, 'details' => $details];
    }

    private function fieldTrue(array $record, array $keys): bool
    {
        foreach ($keys as $k) {
            $v = $record[$k] ?? null;
            if ($v === true || $v === 1 || (is_string($v) && in_array(strtolower($v), ['true', '1', 'yes', 'y'], true))) {
                return true;
            }
        }
        return false;
    }

    /**
     * Lookup whether the given SIAKAD prodi master id maps to a graduate
     * program locally. Uses local prodi table (synced separately) + the
     * non_kkn_jenjangs config list.
     */
    private function prodiIsGraduateProgram(string $prodiMasterId): bool
    {
        if ($this->nonKknProdiIds === null) {
            $forbidden = array_map('strtolower', (array) config('siakad_filters.students.non_kkn_jenjangs', []));
            $this->nonKknProdiIds = Prodi::query()
                ->when(! empty($forbidden), function ($q) use ($forbidden) {
                    foreach ($forbidden as $jenjang) {
                        $q->orWhereRaw('LOWER(COALESCE(jenjang, \'\')) LIKE ?', ['%'.$jenjang.'%']);
                    }
                })
                ->pluck('master_id')
                ->filter()
                ->map(fn ($v) => (string) $v)
                ->all();
        }
        return in_array($prodiMasterId, $this->nonKknProdiIds, true);
    }

    /**
     * Direct check against a jenjang/degree string from the incoming payload,
     * matched case-insensitively against non_kkn_jenjangs config. Cheap and
     * does not touch the database.
     */
    private function jenjangIsGraduateProgram(string $jenjang): bool
    {
        $needle = strtolower(trim($jenjang));
        if ($needle === '') {
            return false;
        }

        $forbidden = array_map('strtolower', (array) config('siakad_filters.students.non_kkn_jenjangs', []));
        foreach ($forbidden as $token) {
            if ($token !== '' && str_contains($needle, $token)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Labels for operator-facing reports.
     */
    public static function reasonLabel(string $reason): string
    {
        return match ($reason) {
            self::SKIP_STUDENT_BATCH_TOO_OLD => 'Batch year older than minimum',
            self::SKIP_STUDENT_BATCH_FUTURE => 'Batch year in far future',
            self::SKIP_STUDENT_INACTIVE => 'Status aktif not accepted',
            self::SKIP_STUDENT_GRADUATE_PROGRAM => 'Enrolled in non-KKN jenjang (S2/S3/Pascasarjana)',
            self::SKIP_STUDENT_NO_NIK => 'Missing/invalid NIK (strict mode)',
            self::SKIP_STUDENT_BLOCKLISTED => 'NIM in blocklist',
            self::SKIP_STUDENT_NO_NIM => 'Record has no NIM',
            self::SKIP_LECTURER_INACTIVE => 'Dosen status not aktif',
            self::SKIP_LECTURER_TUGAS_BELAJAR => 'Dosen on tugas belajar',
            self::SKIP_LECTURER_BLOCKLISTED => 'NIP in blocklist',
            self::SKIP_LECTURER_NO_NIP => 'Record has no NIP',
            default => $reason,
        };
    }
}
