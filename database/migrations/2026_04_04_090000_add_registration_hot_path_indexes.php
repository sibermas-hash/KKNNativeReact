<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $schema = Schema::connection('kkn');

        $this->addIndexIfMissing($schema, 'kelompok_kkn', 'kelompok_kkn_period_status_idx', ['periode_id', 'status']);
        $this->addIndexIfMissing($schema, 'periode', 'periode_active_registration_window_idx', ['is_active', 'registration_start', 'registration_end']);
        $this->addIndexIfMissing($schema, 'peserta_kkn', 'peserta_kkn_mahasiswa_status_idx', ['mahasiswa_id', 'status']);
    }

    public function down(): void
    {
        $schema = Schema::connection('kkn');

        $this->dropIndexIfExists($schema, 'kelompok_kkn', 'kelompok_kkn_period_status_idx');
        $this->dropIndexIfExists($schema, 'periode', 'periode_active_registration_window_idx');
        $this->dropIndexIfExists($schema, 'peserta_kkn', 'peserta_kkn_mahasiswa_status_idx');
    }

    private function addIndexIfMissing(
        Builder $schema,
        string $table,
        string $indexName,
        array $columns
    ): void {
        if (! $schema->hasTable($table)) {
            return;
        }

        foreach ($columns as $column) {
            if (! $schema->hasColumn($table, $column)) {
                return;
            }
        }

        if ($this->hasIndex($schema, $table, $indexName, $columns)) {
            return;
        }

        $schema->table($table, function (Blueprint $tableObj) use ($columns, $indexName) {
            $tableObj->index($columns, $indexName);
        });
    }

    private function dropIndexIfExists(
        Builder $schema,
        string $table,
        string $indexName
    ): void {
        if (! $schema->hasTable($table) || ! $schema->hasIndex($table, $indexName)) {
            return;
        }

        $schema->table($table, function (Blueprint $tableObj) use ($indexName) {
            $tableObj->dropIndex($indexName);
        });
    }

    private function hasIndex(
        Builder $schema,
        string $table,
        string $indexName,
        array $columns
    ): bool {
        foreach ($schema->getIndexes($table) as $index) {
            if (($index['name'] ?? null) === $indexName) {
                return true;
            }

            if (($index['columns'] ?? []) === $columns) {
                return true;
            }
        }

        return false;
    }
};
