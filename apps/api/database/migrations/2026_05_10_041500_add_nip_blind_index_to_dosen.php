<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * PII Phase 2: blind index infrastructure for `dosen.nip`.
 *
 * Mirror of the mahasiswa.nim migration. Pattern:
 *   - Add `nip_bidx` VARCHAR(64) indexed (HMAC-SHA256 hex).
 *   - Widen `nip` to TEXT (headroom for future ciphertext).
 *   - Drop old UNIQUE on `nip`; uniqueness moves to bidx.
 *
 * Backfill + caller migration handled in code.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('dosen')) {
            return;
        }

        $driver = DB::connection()->getDriverName();

        if (! Schema::hasColumn('dosen', 'nip_bidx')) {
            Schema::table('dosen', function (Blueprint $t) {
                $t->string('nip_bidx', 64)->nullable()->after('nip');
                $t->index('nip_bidx', 'dosen_nip_bidx_index');
            });
        }

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE dosen DROP CONSTRAINT IF EXISTS dosen_nip_unique');
            DB::statement('DROP INDEX IF EXISTS dosen_nip_unique');
            DB::statement('ALTER TABLE dosen ALTER COLUMN nip TYPE TEXT');
        } else {
            Schema::table('dosen', function (Blueprint $t) {
                $t->dropUnique('dosen_nip_unique');
            });
            Schema::table('dosen', function (Blueprint $t) {
                $t->text('nip')->change();
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('dosen')) {
            return;
        }

        $driver = DB::connection()->getDriverName();

        if (Schema::hasColumn('dosen', 'nip_bidx')) {
            Schema::table('dosen', function (Blueprint $t) {
                $t->dropIndex('dosen_nip_bidx_index');
                $t->dropColumn('nip_bidx');
            });
        }

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE dosen ALTER COLUMN nip TYPE VARCHAR(20)');
            DB::statement('ALTER TABLE dosen ADD CONSTRAINT dosen_nip_unique UNIQUE (nip)');
        } else {
            Schema::table('dosen', function (Blueprint $t) {
                $t->string('nip', 20)->change();
                $t->unique('nip', 'dosen_nip_unique');
            });
        }
    }
};
