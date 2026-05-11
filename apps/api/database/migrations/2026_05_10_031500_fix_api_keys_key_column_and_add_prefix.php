<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Fix API-key column sizing + add indexed prefix lookup.
 *
 * Background: _api_keys.key was VARCHAR(64) UNIQUE. The ApiKey model's
 * setKeyAttribute() mutator runs Hash::make($value), which with the
 * app default (argon2id) produces a ~97-char hash. Any Hash::make output
 * saved into that column was being TRUNCATED, producing a broken hash
 * that no Hash::check() could ever verify. Authentication silently
 * collapsed the first time anyone tried to use a generated key.
 *
 * Fix:
 *   - Expand `key` to TEXT so any future hash driver (bcrypt=60,
 *     argon2id=97, argon2i=~100) fits without truncation.
 *   - Drop the UNIQUE constraint on `key` — hash collisions are
 *     probabilistically impossible and the column can't be usefully
 *     queried by a secret value anyway (we always look up by prefix).
 *   - Add `key_prefix` VARCHAR(16), indexed, to replace the O(n) LIKE
 *     scans in ApiKey::findByPlaintext(). The plaintext layout is
 *     `sk_<hex>` (35 chars); we store the first 11 chars ("sk_" + 8
 *     hex) which is enough to narrow a lookup to ~1 row in practice
 *     while still being small / indexable.
 *
 * The table is currently empty so there is no data migration to run.
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1) Drop the UNIQUE constraint (PG-specific unique index name).
        // Laravel generates `_api_keys_key_unique` from Blueprint::unique().
        // Use a guarded DROP to stay reversible if the name differs.
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE _api_keys DROP CONSTRAINT IF EXISTS _api_keys_key_unique');
            DB::statement('DROP INDEX IF EXISTS _api_keys_key_unique');
            DB::statement('DROP INDEX IF EXISTS _api_keys_key_index');

            // 2) Expand `key` to TEXT.
            DB::statement('ALTER TABLE _api_keys ALTER COLUMN key TYPE TEXT');
        } else {
            // MySQL / SQLite path (used in testing). Schema builder handles it.
            Schema::table('_api_keys', function (Blueprint $t) {
                $t->dropUnique(['key']);
            });

            Schema::table('_api_keys', function (Blueprint $t) {
                $t->text('key')->change();
            });
        }

        // 3) Add prefix column with index for fast lookup.
        Schema::table('_api_keys', function (Blueprint $t) {
            $t->string('key_prefix', 16)->nullable()->after('key');
            $t->index('key_prefix', '_api_keys_key_prefix_idx');
        });
    }

    public function down(): void
    {
        Schema::table('_api_keys', function (Blueprint $t) {
            $t->dropIndex('_api_keys_key_prefix_idx');
            $t->dropColumn('key_prefix');
        });

        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE _api_keys ALTER COLUMN key TYPE VARCHAR(64)');
            DB::statement('ALTER TABLE _api_keys ADD CONSTRAINT _api_keys_key_unique UNIQUE (key)');
            DB::statement('CREATE INDEX IF NOT EXISTS _api_keys_key_index ON _api_keys (key)');
        } else {
            Schema::table('_api_keys', function (Blueprint $t) {
                $t->string('key', 64)->change();
                $t->unique('key');
                $t->index('key');
            });
        }
    }
};
