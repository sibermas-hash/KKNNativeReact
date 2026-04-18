<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $connection = config('database.kkn_connection', 'kkn');
        $schema = Schema::connection($connection);

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
            if ($schema->hasTable($table)) {
                $existingColumns = array_values(array_filter($columns, fn (string $col) => $schema->hasColumn($table, $col)));

                if ($existingColumns === []) {
                    continue;
                }

                foreach ($existingColumns as $col) {
                    $indexName = "{$table}_{$col}_index";
                    DB::connection($connection)->statement(
                        sprintf('create index if not exists "%s" on "%s" ("%s")', $indexName, $table, $col)
                    );
                }
            }
        }
    }

    public function down(): void
    {
        $connection = config('database.kkn_connection', 'kkn');
        $schema = Schema::connection($connection);

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
            if ($schema->hasTable($table)) {
                $existingColumns = array_values(array_filter($columns, fn (string $col) => $schema->hasColumn($table, $col)));

                if ($existingColumns === []) {
                    continue;
                }

                foreach ($existingColumns as $col) {
                    $indexName = "{$table}_{$col}_index";
                    DB::connection($connection)->statement(
                        sprintf('drop index if exists "%s"', $indexName)
                    );
                }
            }
        }
    }
};
