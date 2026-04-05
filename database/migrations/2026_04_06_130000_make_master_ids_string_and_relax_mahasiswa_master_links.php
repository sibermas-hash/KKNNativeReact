<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->convertMasterIdToString('fakultas');
        $this->convertMasterIdToString('prodi');
        $this->convertMasterIdToString('mahasiswa');
        $this->convertMasterIdToString('dosen');

        if (Schema::hasTable('mahasiswa')) {
            DB::statement('ALTER TABLE mahasiswa ALTER COLUMN faculty_id DROP NOT NULL');
            DB::statement('ALTER TABLE mahasiswa ALTER COLUMN program_id DROP NOT NULL');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('mahasiswa')) {
            DB::statement('UPDATE mahasiswa SET faculty_id = (SELECT id FROM fakultas ORDER BY id LIMIT 1) WHERE faculty_id IS NULL');
            DB::statement('UPDATE mahasiswa SET program_id = (SELECT id FROM prodi ORDER BY id LIMIT 1) WHERE program_id IS NULL');
            DB::statement('ALTER TABLE mahasiswa ALTER COLUMN faculty_id SET NOT NULL');
            DB::statement('ALTER TABLE mahasiswa ALTER COLUMN program_id SET NOT NULL');
        }

        $this->convertMasterIdToBigInt('dosen');
        $this->convertMasterIdToBigInt('mahasiswa');
        $this->convertMasterIdToBigInt('prodi');
        $this->convertMasterIdToBigInt('fakultas');
    }

    private function convertMasterIdToString(string $table): void
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'master_id')) {
            return;
        }

        DB::statement("ALTER TABLE {$table} ALTER COLUMN master_id TYPE VARCHAR(255) USING master_id::text");
    }

    private function convertMasterIdToBigInt(string $table): void
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'master_id')) {
            return;
        }

        DB::statement("UPDATE {$table} SET master_id = NULL WHERE master_id IS NOT NULL AND master_id !~ '^[0-9]+$'");
        DB::statement("ALTER TABLE {$table} ALTER COLUMN master_id TYPE BIGINT USING NULLIF(master_id, '')::bigint");
    }
};
