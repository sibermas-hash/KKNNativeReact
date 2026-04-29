<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Consolidate duplicate columns in mahasiswa table:
 *
 * 1. `total_sks` → merged into `sks_completed` (single source of truth)
 * 2. `is_bta_ppi_passed` → removed (always computed from `status_bta_ppi`)
 *
 * Before dropping, we copy any non-zero `total_sks` values into `sks_completed`
 * where `sks_completed` is 0/null to preserve data.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('mahasiswa')) {
            return;
        }

        // Step 1: Sync total_sks → sks_completed before dropping
        if (Schema::hasColumn('mahasiswa', 'total_sks') && Schema::hasColumn('mahasiswa', 'sks_completed')) {
            DB::statement('
                UPDATE mahasiswa
                SET sks_completed = total_sks
                WHERE (sks_completed IS NULL OR sks_completed = 0)
                  AND total_sks IS NOT NULL
                  AND total_sks > 0
            ');
        }

        // Step 2: Drop duplicate columns
        Schema::table('mahasiswa', function (Blueprint $table) {
            $columnsToDrop = [];

            if (Schema::hasColumn('mahasiswa', 'total_sks')) {
                $columnsToDrop[] = 'total_sks';
            }
            if (Schema::hasColumn('mahasiswa', 'is_bta_ppi_passed')) {
                $columnsToDrop[] = 'is_bta_ppi_passed';
            }

            if ($columnsToDrop !== []) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('mahasiswa')) {
            return;
        }

        Schema::table('mahasiswa', function (Blueprint $table) {
            if (! Schema::hasColumn('mahasiswa', 'total_sks')) {
                $table->integer('total_sks')->default(0)->after('sks_completed');
            }
            if (! Schema::hasColumn('mahasiswa', 'is_bta_ppi_passed')) {
                $table->boolean('is_bta_ppi_passed')->default(false)->after('status_bta_ppi');
            }
        });

        // Restore total_sks from sks_completed
        if (Schema::hasColumn('mahasiswa', 'total_sks') && Schema::hasColumn('mahasiswa', 'sks_completed')) {
            DB::statement('UPDATE mahasiswa SET total_sks = sks_completed');
        }
    }
};
