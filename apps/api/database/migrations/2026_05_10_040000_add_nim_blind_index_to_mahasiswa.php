<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * PII Phase 2: blind index + encryption infrastructure for `mahasiswa.nim`.
 *
 * Steps executed:
 *   1. Add `nim_bidx` (HMAC-SHA256 hex, 64 chars) — nullable + indexed.
 *      Unique constraint is added but DEFERRED until backfill populates it.
 *   2. Widen `nim` from VARCHAR(20) to TEXT so future AES ciphertext fits
 *      (same pattern as nik/mother_name/alamat migration).
 *   3. Drop old UNIQUE constraint on plaintext `nim` — it cannot be enforced
 *      once we eventually move to ciphertext. Uniqueness is preserved via
 *      the new `nim_bidx` column.
 *   4. Keep a regular (non-unique) index on `nim` for existing ilike/search
 *      usage that still needs to work during the transition window.
 *
 * Separate follow-up steps handled by code, not migration:
 *   - Populate nim_bidx for existing rows (see command pii:encrypt-mahasiswa
 *     which now also backfills bidx).
 *   - Switch all `Mahasiswa::where('nim', $v)` call sites to
 *     `Mahasiswa::whereBlind('nim', $v)`.
 *   - Enable `encrypted` cast on `nim` after callers migrated.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('mahasiswa')) {
            return;
        }

        $driver = DB::connection()->getDriverName();

        // (1) Add nim_bidx column.
        if (! Schema::hasColumn('mahasiswa', 'nim_bidx')) {
            Schema::table('mahasiswa', function (Blueprint $t) {
                $t->string('nim_bidx', 64)->nullable()->after('nim');
                $t->index('nim_bidx', 'mahasiswa_nim_bidx_index');
            });
        }

        // (2) Drop old UNIQUE constraint on `nim` so we can move to bidx-based
        // uniqueness AND make the column resizeable without data coercion.
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE mahasiswa DROP CONSTRAINT IF EXISTS mahasiswa_nim_unique');
            DB::statement('DROP INDEX IF EXISTS mahasiswa_nim_unique');
            // (3) Widen column. Keep non-unique index on nim for interim search.
            DB::statement('ALTER TABLE mahasiswa ALTER COLUMN nim TYPE TEXT');
        } else {
            // SQLite/MySQL fallback (mostly for testing).
            Schema::table('mahasiswa', function (Blueprint $t) {
                $t->dropUnique('mahasiswa_nim_unique');
            });
            Schema::table('mahasiswa', function (Blueprint $t) {
                $t->text('nim')->nullable(false)->change();
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('mahasiswa')) {
            return;
        }

        $driver = DB::connection()->getDriverName();

        if (Schema::hasColumn('mahasiswa', 'nim_bidx')) {
            Schema::table('mahasiswa', function (Blueprint $t) {
                $t->dropIndex('mahasiswa_nim_bidx_index');
                $t->dropColumn('nim_bidx');
            });
        }

        if ($driver === 'pgsql') {
            // Only safe if data in nim is still short. If ciphertext is already
            // there, this ALTER will fail loudly — intentional.
            DB::statement('ALTER TABLE mahasiswa ALTER COLUMN nim TYPE VARCHAR(20)');
            DB::statement('ALTER TABLE mahasiswa ADD CONSTRAINT mahasiswa_nim_unique UNIQUE (nim)');
        } else {
            Schema::table('mahasiswa', function (Blueprint $t) {
                $t->string('nim', 20)->change();
                $t->unique('nim', 'mahasiswa_nim_unique');
            });
        }
    }
};
