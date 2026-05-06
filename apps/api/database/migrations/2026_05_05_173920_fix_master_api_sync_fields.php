<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Fixes database schema to match MASTER API requirements:
     * 1. Adds organization_id to prodi table for proper faculty mapping
     * 2. Adds level to fakultas table for precise filtering
     * 3. Drops redundant total_sks from mahasiswa
     * 4. Drops redundant is_bta_ppi_passed from mahasiswa
     * 5. Ensures master_synced_at indexes exist on all sync tables
     */
    public function up(): void
    {
        // Fix 1: Add organization_id to prodi table
        if (! Schema::hasColumn('prodi', 'organization_id')) {
            Schema::table('prodi', function (Blueprint $table) {
                $table->string('organization_id', 20)->nullable()->after('code');
            });
            
            // Index for faster lookups during sync
            Schema::table('prodi', function (Blueprint $table) {
                $table->index('organization_id', 'idx_prodi_organization_id');
            });
            
            // Populate organization_id from existing data if possible
            // This helps mapping prodi back to their master faculty codes
            DB::statement("
                UPDATE prodi p
                SET organization_id = f.master_id
                FROM fakultas f
                WHERE p.fakultas_id = f.id
                AND f.master_id IS NOT NULL
            ");
        }

        // Fix 2: Add level to fakultas table
        if (! Schema::hasColumn('fakultas', 'level')) {
            Schema::table('fakultas', function (Blueprint $table) {
                $table->integer('level')->nullable()->after('code');
            });

            // Set default level for existing faculties (2 = faculty level)
            DB::statement("
                UPDATE fakultas 
                SET level = 2 
                WHERE level IS NULL 
                AND (LOWER(nama) LIKE '%fakultas%' OR LOWER(code) LIKE '%f%')
            ");

            // Level 1 for other organizations (universitas level)
            DB::statement("
                UPDATE fakultas 
                SET level = 1 
                WHERE level IS NULL
            ");
        }

        // Fix 3: Drop redundant total_sks from mahasiswa
        if (Schema::hasColumn('mahasiswa', 'total_sks')) {
            Schema::table('mahasiswa', function (Blueprint $table) {
                $table->dropColumn('total_sks');
            });
        }

        // Fix 4: Drop redundant is_bta_ppi_passed from mahasiswa
        if (Schema::hasColumn('mahasiswa', 'is_bta_ppi_passed')) {
            Schema::table('mahasiswa', function (Blueprint $table) {
                $table->dropColumn('is_bta_ppi_passed');
            });
        }

        // Fix 5: Ensure master_synced_at indexes exist
        $this->ensureMasterSyncedAtIndex('mahasiswa');
        $this->ensureMasterSyncedAtIndex('dosen');
        $this->ensureMasterSyncedAtIndex('fakultas');
        $this->ensureMasterSyncedAtIndex('prodi');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse Fix 1: Remove organization_id from prodi
        if (Schema::hasColumn('prodi', 'organization_id')) {
            Schema::table('prodi', function (Blueprint $table) {
                $table->dropIndex('idx_prodi_organization_id');
                $table->dropColumn('organization_id');
            });
        }

        // Reverse Fix 2: Remove level from fakultas
        if (Schema::hasColumn('fakultas', 'level')) {
            Schema::table('fakultas', function (Blueprint $table) {
                $table->dropColumn('level');
            });
        }

        // Reverse Fix 3: Restore total_sks to mahasiswa
        if (! Schema::hasColumn('mahasiswa', 'total_sks')) {
            Schema::table('mahasiswa', function (Blueprint $table) {
                $table->integer('total_sks')->default(0)->after('nim');
            });

            // Restore data from sks_completed
            DB::statement("
                UPDATE mahasiswa 
                SET total_sks = sks_completed 
                WHERE total_sks = 0 AND sks_completed > 0
            ");
        }

        // Reverse Fix 4: Restore is_bta_ppi_passed to mahasiswa
        if (! Schema::hasColumn('mahasiswa', 'is_bta_ppi_passed')) {
            Schema::table('mahasiswa', function (Blueprint $table) {
                $table->boolean('is_bta_ppi_passed')->default(false)->after('status_bta_ppi');
            });

            // Restore based on status_bta_ppi
            DB::statement("
                UPDATE mahasiswa 
                SET is_bta_ppi_passed = true 
                WHERE status_bta_ppi = 'LULUS'
            ");
        }

        // Note: We don't reverse Fix 5 (indexes) as they're beneficial
    }

    /**
     * Ensure master_synced_at index exists on a table.
     */
    protected function ensureMasterSyncedAtIndex(string $tableName): void
    {
        if (! Schema::hasTable($tableName)) {
            return;
        }

        if (! Schema::hasColumn($tableName, 'master_synced_at')) {
            return;
        }

        if (! Schema::hasIndex($tableName, "idx_{$tableName}_master_synced_at")) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                $table->index('master_synced_at', "idx_{$tableName}_master_synced_at");
            });
        }
    }
};
