<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * R13-DB-001: add `deleted_at` columns to the three identity tables
 * (users, mahasiswa, dosen) that were missing soft deletes.
 *
 * Hard-deleting a user cascades through `users` FKs and destroys all
 * kegiatan, peserta_kkn, nilai, evaluasi, chat history, etc. With
 * soft-delete the record is preserved for audit and PDP right-to-erasure
 * can be implemented as a soft-delete + anonymize step.
 *
 * This migration is additive and idempotent; any code still relying on
 * hard-delete `->delete()` on these models will start returning the soft
 * delete once the corresponding `SoftDeletes` trait is added to the
 * models (see User/Mahasiswa/Dosen models).
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (['users', 'mahasiswa', 'dosen'] as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }
            if (Schema::hasColumn($table, 'deleted_at')) {
                continue;
            }
            Schema::table($table, function (Blueprint $t): void {
                $t->softDeletes();
            });
        }
    }

    public function down(): void
    {
        foreach (['users', 'mahasiswa', 'dosen'] as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }
            if (! Schema::hasColumn($table, 'deleted_at')) {
                continue;
            }
            Schema::table($table, function (Blueprint $t): void {
                $t->dropSoftDeletes();
            });
        }
    }
};
