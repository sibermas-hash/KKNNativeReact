<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Perbaiki unique constraints yang tidak partial terhadap soft-delete.
 *
 * Audit findings (2026-05-13):
 *
 *   P-1. peserta_kkn UNIQUE (mahasiswa_id, periode_id) tidak partial
 *        WHERE deleted_at IS NULL. Skenario bug:
 *        1. Mahasiswa daftar periode X → row created
 *        2. Student cancel → status=cancelled + soft-delete (deleted_at set)
 *        3. Student daftar ulang periode X → UNIQUE violation karena row
 *           lama (soft-deleted) masih ada di index
 *        RegistrationService:147-161 sudah handle via withTrashed()+restore(),
 *        tapi ada race window. Better: partial index supaya soft-deleted
 *        tidak block.
 *
 *   P-2. kelompok_kkn.code UNIQUE — sama, tidak partial. Kalau kelompok
 *        di-soft-delete lalu operator buat kelompok baru dengan code yang
 *        sama, akan bentrok dengan row lama.
 *
 *   P-3. antrian_kkn UNIQUE (mahasiswa_id, periode_id) — antrian tidak
 *        pakai SoftDeletes jadi tidak relevan, tapi dokumentasikan
 *        untuk clarity.
 *
 * Migration ini PostgreSQL-specific (partial index syntax). MySQL tidak
 * support partial index standard, jadi guard by driver.
 */
return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver !== 'pgsql') {
            // MySQL/SQLite tidak support partial unique index standar.
            // Skip — constraint existing tetap enforce tapi dengan soft-delete
            // drawback yang di-handle manual di RegistrationService.
            return;
        }

        // P-1: peserta_kkn (mahasiswa_id, periode_id) partial
        if (Schema::hasTable('peserta_kkn') && Schema::hasColumn('peserta_kkn', 'deleted_at')) {
            DB::statement('ALTER TABLE peserta_kkn DROP CONSTRAINT IF EXISTS unique_mahasiswa_periode');
            DB::statement('DROP INDEX IF EXISTS unique_mahasiswa_periode');
            DB::statement('DROP INDEX IF EXISTS peserta_kkn_mahasiswa_id_periode_id_unique');

            DB::statement('
                CREATE UNIQUE INDEX unique_mahasiswa_periode_active
                ON peserta_kkn (mahasiswa_id, periode_id)
                WHERE deleted_at IS NULL
            ');
        }

        // P-2: kelompok_kkn.code partial
        if (Schema::hasTable('kelompok_kkn') && Schema::hasColumn('kelompok_kkn', 'deleted_at')) {
            DB::statement('ALTER TABLE kelompok_kkn DROP CONSTRAINT IF EXISTS kelompok_kkn_code_unique');
            DB::statement('DROP INDEX IF EXISTS kelompok_kkn_code_unique');

            DB::statement('
                CREATE UNIQUE INDEX kelompok_kkn_code_unique_active
                ON kelompok_kkn (code)
                WHERE deleted_at IS NULL
            ');
        }
    }

    public function down(): void
    {
        $driver = DB::connection()->getDriverName();
        if ($driver !== 'pgsql') {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS unique_mahasiswa_periode_active');
        DB::statement('DROP INDEX IF EXISTS kelompok_kkn_code_unique_active');

        // Restore full unique (non-partial) sebagai safety net.
        if (Schema::hasTable('peserta_kkn')) {
            DB::statement('
                CREATE UNIQUE INDEX IF NOT EXISTS unique_mahasiswa_periode
                ON peserta_kkn (mahasiswa_id, periode_id)
            ');
        }
        if (Schema::hasTable('kelompok_kkn')) {
            DB::statement('
                CREATE UNIQUE INDEX IF NOT EXISTS kelompok_kkn_code_unique
                ON kelompok_kkn (code)
            ');
        }
    }
};
