<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Audit R11-FULL-010 / R9-009 fix: satu kelompok hanya boleh punya satu Ketua.
 *
 * 1) Bersihkan duplikat existing: kalau ada >1 peserta dengan role='Ketua' di
 *    kelompok yang sama, pertahankan yang paling lama (id terkecil) dan
 *    demote sisanya jadi role=NULL (Anggota).
 *
 * 2) Tambah partial unique index di PostgreSQL supaya insert/update
 *    berikutnya tidak bisa lagi menciptakan ketua ganda. Index hanya
 *    berlaku untuk row aktif (deleted_at IS NULL) agar soft-deleted peserta
 *    tidak memblokir re-assignment ketua baru.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('peserta_kkn') || ! Schema::hasColumn('peserta_kkn', 'role')) {
            return;
        }

        // 1. Dedup: keep oldest 'Ketua' per kelompok, null the rest.
        //    `raw` is safe here — we interpolate nothing from user input.
        DB::statement(<<<'SQL'
            UPDATE peserta_kkn p
            SET role = NULL
            WHERE p.role = 'Ketua'
              AND p.deleted_at IS NULL
              AND p.id NOT IN (
                  SELECT MIN(id)
                  FROM peserta_kkn
                  WHERE role = 'Ketua'
                    AND deleted_at IS NULL
                    AND kelompok_id IS NOT NULL
                  GROUP BY kelompok_id
              )
        SQL);

        // 2. Partial unique index (PostgreSQL-specific).
        //    Works on the current connection driver only; guarded for safety.
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS peserta_kkn_kelompok_ketua_unique');
            DB::statement(<<<'SQL'
                CREATE UNIQUE INDEX peserta_kkn_kelompok_ketua_unique
                ON peserta_kkn (kelompok_id)
                WHERE role = 'Ketua' AND deleted_at IS NULL
            SQL);
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS peserta_kkn_kelompok_ketua_unique');
        }
    }
};
