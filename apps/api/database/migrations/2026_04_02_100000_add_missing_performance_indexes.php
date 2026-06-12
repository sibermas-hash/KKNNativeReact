<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tables = [
            'dosen' => ['nip', 'fakultas_id', 'user_id'],
            'mahasiswa' => ['nim', 'fakultas_id', 'prodi_id', 'user_id'],
            'periode' => ['academic_year_id', 'is_active'],
            'kelompok_kkn' => ['periode_id', 'lokasi_id', 'dpl_id'],
            'evaluasi' => ['mahasiswa_id', 'kelompok_id', 'evaluator_id'],
            'proposal' => ['kelompok_id', 'status'],
            'workshop' => ['periode_id'],
        ];

        foreach ($tables as $table => $columns) {
            if (Schema::hasTable($table)) {
                $existingColumns = array_values(array_filter($columns, fn (string $col) => Schema::hasColumn($table, $col)));

                if ($existingColumns === []) {
                    continue;
                }

                foreach ($existingColumns as $col) {
                    $indexName = "{$table}_{$col}_index";
                    DB::statement(
                        sprintf('create index if not exists "%s" on "%s" ("%s")', $indexName, $table, $col)
                    );
                }
            }
        }
    }

    public function down(): void
    {
        $tables = [
            'dosen' => ['nip', 'fakultas_id', 'user_id'],
            'mahasiswa' => ['nim', 'fakultas_id', 'prodi_id', 'user_id'],
            'periode' => ['academic_year_id', 'is_active'],
            'kelompok_kkn' => ['periode_id', 'lokasi_id', 'dpl_id'],
            'evaluasi' => ['mahasiswa_id', 'kelompok_id', 'evaluator_id'],
            'proposal' => ['kelompok_id', 'status'],
            'workshop' => ['periode_id'],
        ];

        foreach ($tables as $table => $columns) {
            if (Schema::hasTable($table)) {
                $existingColumns = array_values(array_filter($columns, fn (string $col) => Schema::hasColumn($table, $col)));

                if ($existingColumns === []) {
                    continue;
                }

                foreach ($existingColumns as $col) {
                    $indexName = "{$table}_{$col}_index";
                    DB::statement(
                        sprintf('drop index if exists "%s"', $indexName)
                    );
                }
            }
        }
    }
};
