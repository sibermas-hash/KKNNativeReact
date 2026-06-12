<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * PII Phase 3b: widen sensitive columns on currently-empty tables so that
 * future inserts (which will be subject to the `encrypted` cast in the
 * corresponding models) don't truncate ciphertext.
 *
 * Target fields:
 *   - profil_user.phone, profil_user.address
 *   - dokumen_peserta_kkn.file_path, dokumen_peserta_kkn.notes
 *   - izin_meninggalkan.alasan
 *   - attendances.ip_address
 *   - dispensasi_kkn.alasan (nim skipped — searched via ilike)
 *
 * All target tables have zero rows right now, so there is nothing to
 * backfill. We are only preparing the schema for when data starts flowing.
 */
return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        $changes = [
            'profil_user' => ['phone'],
            'dokumen_peserta_kkn' => ['file_path'],
            'izin_meninggalkan' => ['alasan'],
            'attendances' => ['ip_address'],
            'dispensasi_kkn' => ['alasan'],
        ];

        foreach ($changes as $table => $columns) {
            if (! Schema::hasTable($table)) {
                continue;
            }
            foreach ($columns as $column) {
                if (! Schema::hasColumn($table, $column)) {
                    continue;
                }

                if ($driver === 'pgsql') {
                    DB::statement("ALTER TABLE {$table} ALTER COLUMN {$column} TYPE TEXT");
                } else {
                    Schema::table($table, function ($t) use ($column) {
                        $t->text($column)->nullable()->change();
                    });
                }
            }
        }
    }

    public function down(): void
    {
        // Safe no-op; shrinking a TEXT that may now hold ciphertext is a
        // bad idea.
    }
};
