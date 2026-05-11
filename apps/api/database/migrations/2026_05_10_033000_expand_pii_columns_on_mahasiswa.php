<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Expand PII columns so that Laravel's `encrypted` cast payloads fit.
 *
 * Laravel encrypts values with AES-256-GCM and base64-encodes a JSON envelope
 * containing IV + MAC + ciphertext. A 16-char NIK (Indonesian ID) balloons to
 * ~240 chars once encrypted. If we leave the column at VARCHAR(32) the first
 * save would silently truncate the ciphertext and NOTHING would ever decrypt
 * again — the same shape of bug we hit with api_keys.key.
 *
 * This migration PREPARES the column sizes only. Actual encryption is enabled
 * by adding the `encrypted` cast in the Mahasiswa model; it can be rolled back
 * by removing the cast and running a decrypt backfill, with the columns kept
 * as TEXT for headroom.
 *
 * Scope: This migration covers the three low-risk PII fields on `mahasiswa`
 * (NIK, mother's maiden name, home address) that are NEVER used in WHERE
 * clauses across the codebase, so they can be encrypted without a blind-index
 * column. Phase 2 (NIM, email, phone) will require HMAC blind indexes and is
 * tracked separately in docs/PII_ENCRYPTION_PLAN.md.
 *
 * mahasiswa is currently a sync target — existing plaintext rows will be
 * encrypted on next write (via the cast). A separate backfill command can be
 * added to proactively encrypt historical rows once the team is ready.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('mahasiswa')) {
            return;
        }

        $driver = DB::connection()->getDriverName();

        // Each ALTER is guarded individually so partial prior state
        // (e.g. someone already widened one column) doesn't block the migration.
        $columns = ['nik', 'mother_name', 'alamat'];

        foreach ($columns as $column) {
            if (! Schema::hasColumn('mahasiswa', $column)) {
                continue;
            }

            if ($driver === 'pgsql') {
                DB::statement("ALTER TABLE mahasiswa ALTER COLUMN {$column} TYPE TEXT");
            } else {
                Schema::table('mahasiswa', function (Blueprint $t) use ($column) {
                    $t->text($column)->nullable()->change();
                });
            }
        }
    }

    public function down(): void
    {
        // No-op: shrinking a TEXT that may now hold ciphertext back to
        // VARCHAR(32) would corrupt existing data. If a rollback is truly
        // needed, run a decrypt backfill first, then manually ALTER.
    }
};
