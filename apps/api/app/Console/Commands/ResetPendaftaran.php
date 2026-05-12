<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\AuditService;
use App\Services\RedisCacheService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Reset Pendaftaran KKN untuk simulasi / awal periode baru.
 *
 * Operasi destruktif. Gunakan hanya di maintenance window.
 *
 * Audit fix (2026-05-12):
 *   - Tabel `groups` dikoreksi menjadi `kelompok_kkn` (schema aktual)
 *   - `peserta_kkn` ditambahkan (tabel utama pendaftaran yang sebelumnya lolos)
 *   - Semua turunan (dokumen, attendance, evaluasi, nilai, dst) ikut di-reset
 *   - TRUNCATE ... CASCADE di PostgreSQL (satu statement, atomic)
 *   - Fallback untuk SQLite/MySQL di test suite
 *   - Token user saat ini di-preserve via opsi --keep-token
 *   - Cache tags di-flush setelah reset
 *   - AuditService log untuk forensik
 */
class ResetPendaftaran extends Command
{
    protected $signature = 'pendaftaran:reset
        {--soft : Hanya hapus data pendaftaran (antrian/lock/history), pertahankan kelompok & turunannya}
        {--keep-token= : ID token yang harus dipertahankan (mencegah force-logout operator yang sedang menjalankan reset)}
        {--user= : User ID yang menginisiasi reset (untuk audit log)}
        {--force : Lewati konfirmasi interaktif}';

    protected $description = 'Reset data pendaftaran KKN (simulasi / awal periode). Data master (user, fakultas, prodi, lokasi) tetap aman.';

    /**
     * Tabel yang WAJIB tidak pernah ke-truncate.
     * Dokumentasi sejarah — tidak dipakai runtime, hanya referensi reviewer.
     *
     *   users, roles, permissions, model_has_roles, model_has_permissions,
     *   role_has_permissions, fakultas, prodi, academic_years, jenis_kkn,
     *   periode, tahun_akademik, lokasi, mahasiswa, dosen,
     *   system_settings, kkn_requirements, document_templates
     */

    /**
     * Tabel pendaftaran yang selalu di-reset (mode full & soft).
     * Dipisah supaya --soft dapat memilih subset.
     */
    private array $softTables = [
        'antrian_kkn',
        'slot_terkunci',
        'registration_histories',
    ];

    /**
     * Tabel turunan pendaftaran (kelompok + anak-anaknya).
     * TRUNCATE ... CASCADE di PostgreSQL akan otomatis menjalar ke child FK
     * (cascadeOnDelete), jadi daftar ini cukup mencakup root tables. Tapi
     * kita list eksplisit untuk:
     *   1. Transparansi — audit log tahu apa yang di-clear
     *   2. Kompatibilitas dengan driver tanpa CASCADE (SQLite test)
     */
    private array $registrationTables = [
        // Level bawah — anak langsung peserta_kkn / kelompok_kkn
        'bimbingan_attendances',
        'file_kegiatan_kkn',
        'attendance_photos',
        'attendance_sync_logs',
        'attendances',
        'location_dispensations',
        'absensi_harian',
        'dokumen_peserta_kkn',
        'monitoring_dpl',
        'izin_meninggalkan',
        'item_evaluasi',
        'evaluasi',
        'nilai_kkn',
        'sertifikat_kkn',
        'rekapitulasi_kegiatan',
        'proposal_program_kerja',
        'kegiatan_kkn',
        'program_kerja',
        'laporan_akhir',
        'posko_kelompok',
        'dpl_kelompok',
        'group_members',
        'peserta_kkn',
        // Parent
        'kelompok_kkn',
    ];

    public function handle(): int
    {
        $softOnly = (bool) $this->option('soft');
        $force = (bool) $this->option('force');
        $keepTokenId = $this->option('keep-token');
        $userId = $this->option('user');

        $tablesToReset = $softOnly
            ? $this->softTables
            : array_merge($this->registrationTables, $this->softTables);

        if (! $force && ! $this->confirm(
            "⚠️  Anda akan MENGHAPUS PERMANEN data pendaftaran KKN.\n"
            .'  Mode: '.($softOnly ? 'soft (queue/lock/history)' : 'full (termasuk kelompok & semua turunan)')."\n"
            .'  Tabel: '.implode(', ', array_filter($tablesToReset, fn ($t) => Schema::hasTable($t)))."\n"
            ."  Data master (user, fakultas, prodi, lokasi) TETAP aman.\n"
            .'  Lanjutkan?'
        )) {
            $this->warn('Dibatalkan.');

            return self::FAILURE;
        }

        $driver = DB::connection()->getDriverName();
        $stats = [];

        try {
            // Preserve operator token supaya tidak force-logout di tengah request.
            // Dilakukan SEBELUM truncate supaya delete-with-filter tetap preserve.
            if (in_array('personal_access_tokens', $tablesToReset, true) || ! $softOnly) {
                $tokenCount = DB::table('personal_access_tokens')
                    ->when($keepTokenId, fn ($q) => $q->where('id', '!=', $keepTokenId))
                    ->delete();
                $stats['personal_access_tokens'] = $tokenCount;
                $this->info("  ✅ personal_access_tokens: $tokenCount token dihapus".($keepTokenId ? " (preserved id={$keepTokenId})" : ''));
            }

            // Truncate/delete registration tables.
            $existing = array_filter($tablesToReset, fn ($t) => Schema::hasTable($t));

            if ($driver === 'pgsql' && ! empty($existing)) {
                // Count dulu supaya audit log punya angka.
                foreach ($existing as $t) {
                    $stats[$t] = DB::table($t)->count();
                }

                // Satu statement, atomic, cascade otomatis ke semua FK dependen.
                $quoted = implode(', ', array_map(fn ($t) => '"'.$t.'"', $existing));
                DB::statement("TRUNCATE {$quoted} RESTART IDENTITY CASCADE");

                foreach ($existing as $t) {
                    $this->info("  ✅ {$t}: {$stats[$t]} baris dihapus");
                }
            } else {
                // SQLite/MySQL fallback — delete dalam urutan anak-dulu.
                // session_replication_role hanya ada di PostgreSQL.
                if ($driver === 'sqlite') {
                    DB::statement('PRAGMA foreign_keys = OFF');
                } elseif ($driver === 'mysql') {
                    DB::statement('SET FOREIGN_KEY_CHECKS=0');
                }

                foreach ($existing as $t) {
                    $count = DB::table($t)->count();
                    DB::table($t)->delete();
                    $stats[$t] = $count;
                    $this->info("  ✅ {$t}: {$count} baris dihapus");
                }

                if ($driver === 'sqlite') {
                    DB::statement('PRAGMA foreign_keys = ON');
                } elseif ($driver === 'mysql') {
                    DB::statement('SET FOREIGN_KEY_CHECKS=1');
                }
            }

            // Missing tables → warn saja (tidak mengganggu operasi).
            foreach (array_diff($tablesToReset, $existing) as $missing) {
                $this->warn("  ⚠️  Tabel '{$missing}' tidak ditemukan di schema, skip.");
            }

            // Flush Redis cache tags terkait pendaftaran.
            $this->flushRelatedCaches();

            // Audit log (best-effort, tidak fail kalau error).
            try {
                AuditService::log(
                    'RESET_PENDAFTARAN'.($softOnly ? '_SOFT' : '_FULL'),
                    'Reset pendaftaran KKN ('.($softOnly ? 'soft' : 'full').') via artisan pendaftaran:reset',
                    null,
                    null,
                    ['tables' => $stats, 'mode' => $softOnly ? 'soft' : 'full'],
                    $userId !== null ? (int) $userId : null
                );
            } catch (\Throwable $e) {
                $this->warn('  ⚠️  Audit log gagal: '.$e->getMessage());
            }
        } catch (\Throwable $e) {
            $this->error('Reset gagal: '.$e->getMessage());

            return self::FAILURE;
        }

        $this->newLine();
        $this->info('✅ Reset pendaftaran selesai!');
        $this->warn('⚠️  Langkah selanjutnya:');
        $this->warn('   1. Restart queue workers (supervisorctl restart workers:*)');
        $this->warn('   2. Buka kembali pendaftaran di admin panel');

        return self::SUCCESS;
    }

    /**
     * Flush cache tags yang mungkin cache data yang baru ke-truncate.
     * Best-effort: kalau cache driver tidak support tags (file/array),
     * exception ditelan — data akan natural-expire saja.
     */
    private function flushRelatedCaches(): void
    {
        try {
            Cache::tags([
                RedisCacheService::TAG_GROUPS,
                'kkn',
                'pendaftaran',
                'registration',
            ])->flush();
        } catch (\Throwable) {
            // Driver tanpa tag support → skip.
        }
    }
}
