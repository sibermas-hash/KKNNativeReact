<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Perbaiki integritas FK di tabel nilai_kkn.
 *
 * Audit findings (2026-05-12):
 *
 *   C-2. `nilai_kkn.kelompok_id` dideklarasikan sebagai
 *        `unsignedBigInteger + index()` tanpa FK constraint
 *        (create_kkn_workshop_and_scores_tables.php:48). Kalau kelompok
 *        dihapus, row nilai orphan tanpa error.
 *
 *   C-3. `nilai_kkn.dpl_graded_by / village_graded_by / admin_graded_by`
 *        FK ke users tapi tanpa `onDelete` rule. PostgreSQL default =
 *        NO ACTION. Kalau user grader dihapus, DELETE user akan ERROR
 *        walaupun ada row nilai yang bisa "sekedar jadi null".
 *
 * Migration ini:
 *   1. Bersihkan orphan `kelompok_id` yang sudah terlanjur (set ke NULL
 *      supaya tidak block penambahan FK).
 *   2. Drop FK lama *_graded_by + re-create dengan `nullOnDelete`.
 *   3. Tambah FK `kelompok_id` → kelompok_kkn dengan `nullOnDelete`.
 *
 * Aman untuk re-run — semua ALTER guard dengan `IF EXISTS`/schema check.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('nilai_kkn')) {
            return;
        }

        // Step 1: Bersihkan orphan kelompok_id sebelum add FK.
        // Kalau kelompok_kkn.id tidak ada, set nilai_kkn.kelompok_id=NULL.
        if (Schema::hasTable('kelompok_kkn')) {
            DB::statement('
                UPDATE nilai_kkn
                SET kelompok_id = NULL
                WHERE kelompok_id IS NOT NULL
                  AND kelompok_id NOT IN (SELECT id FROM kelompok_kkn)
            ');
        }

        // Step 2: Drop FK lama (*_graded_by → users, default NO ACTION)
        // dan re-create dengan nullOnDelete.
        // PostgreSQL: drop constraint by name. Konvensi Laravel:
        //   <table>_<column>_foreign
        $constraintsToReset = [
            'nilai_kkn_dpl_graded_by_foreign',
            'nilai_kkn_village_graded_by_foreign',
            'nilai_kkn_admin_graded_by_foreign',
        ];

        foreach ($constraintsToReset as $constraint) {
            try {
                DB::statement("ALTER TABLE nilai_kkn DROP CONSTRAINT IF EXISTS {$constraint}");
            } catch (Throwable) {
                // MySQL tidak support IF EXISTS di DROP CONSTRAINT — ignore.
            }
        }

        Schema::table('nilai_kkn', function (Blueprint $table) {
            // Re-add FK *_graded_by dengan nullOnDelete.
            // `ignore` flag dipakai untuk tidak melakukan rename; default
            // behavior constrained() akan auto-detect FK name.
            if (Schema::hasColumn('nilai_kkn', 'dpl_graded_by')) {
                $table->foreign('dpl_graded_by', 'nilai_kkn_dpl_graded_by_foreign')
                    ->references('id')->on('users')->nullOnDelete();
            }
            if (Schema::hasColumn('nilai_kkn', 'village_graded_by')) {
                $table->foreign('village_graded_by', 'nilai_kkn_village_graded_by_foreign')
                    ->references('id')->on('users')->nullOnDelete();
            }
            if (Schema::hasColumn('nilai_kkn', 'admin_graded_by')) {
                $table->foreign('admin_graded_by', 'nilai_kkn_admin_graded_by_foreign')
                    ->references('id')->on('users')->nullOnDelete();
            }

            // Step 3: FK kelompok_id (baru — sebelumnya cuma index, tanpa constraint).
            if (Schema::hasColumn('nilai_kkn', 'kelompok_id')) {
                // Kalau sudah ada FK ini dari run sebelumnya, skip.
                try {
                    $table->foreign('kelompok_id', 'nilai_kkn_kelompok_id_foreign')
                        ->references('id')->on('kelompok_kkn')->nullOnDelete();
                } catch (Throwable) {
                    // FK sudah exist — tidak apa-apa.
                }
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('nilai_kkn')) {
            return;
        }

        Schema::table('nilai_kkn', function (Blueprint $table) {
            $fks = [
                'nilai_kkn_dpl_graded_by_foreign',
                'nilai_kkn_village_graded_by_foreign',
                'nilai_kkn_admin_graded_by_foreign',
                'nilai_kkn_kelompok_id_foreign',
            ];
            foreach ($fks as $fk) {
                try {
                    $table->dropForeign($fk);
                } catch (Throwable) {
                    // ignore
                }
            }
        });
    }
};
