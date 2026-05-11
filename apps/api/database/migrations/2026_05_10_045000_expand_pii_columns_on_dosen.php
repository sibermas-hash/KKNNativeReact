<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * PII Phase 2b: widen sensitive Dosen columns for encrypted payloads.
 *
 * Target columns (VARCHAR → TEXT):
 *   - nik          (KTP, 32 chars plaintext → ~240 chars ciphertext)
 *   - phone        (20 chars plaintext → ~200 chars ciphertext)
 *   - no_rekening  (banking data, 50 chars plaintext)
 *   - npwp         (tax ID, 50 chars plaintext)
 *
 * alamat + nip already widened in earlier migrations.
 *
 * Rationale: Dosen personal identifiers + banking info are the most sensitive
 * records in the app. Encrypting them at rest protects against DB-dump
 * leakage (which is the realistic breach scenario for this project).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('dosen')) {
            return;
        }

        $driver = DB::connection()->getDriverName();
        $columns = ['nik', 'phone', 'no_rekening', 'npwp'];

        foreach ($columns as $column) {
            if (! Schema::hasColumn('dosen', $column)) {
                continue;
            }

            if ($driver === 'pgsql') {
                DB::statement("ALTER TABLE dosen ALTER COLUMN {$column} TYPE TEXT");
            } else {
                Schema::table('dosen', function (Blueprint $t) use ($column) {
                    $t->text($column)->nullable()->change();
                });
            }
        }
    }

    public function down(): void
    {
        // No shrink — would truncate ciphertext.
    }
};
