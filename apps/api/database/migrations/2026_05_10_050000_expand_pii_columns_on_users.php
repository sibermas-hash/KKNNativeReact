<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * PII Phase 3: widen users' address + phone columns to TEXT so encrypted
 * cast payloads fit.
 *
 * `address` already TEXT. This migration widens:
 *   - phone (VARCHAR 20)
 *   - address_village_name / district / regency (VARCHAR 150)
 *   - address_postal_code (VARCHAR 10)
 *
 * Not included (left plaintext by design):
 *   - email  — used in Laravel auth lookup; encrypting requires auth guard
 *              override. Addressed in a separate plan.
 *   - address_lat / address_lng — floats, not text; leaked lat/lng is
 *              arguably sensitive but we need them for geo queries.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        $driver = DB::connection()->getDriverName();
        $columns = [
            'phone',
            'address_village_name',
            'address_district_name',
            'address_regency_name',
            'address_postal_code',
        ];

        foreach ($columns as $column) {
            if (! Schema::hasColumn('users', $column)) {
                continue;
            }

            if ($driver === 'pgsql') {
                DB::statement("ALTER TABLE users ALTER COLUMN {$column} TYPE TEXT");
            } else {
                Schema::table('users', function ($t) use ($column) {
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
