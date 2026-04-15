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

        $this->addIndexIfMissing($schema, 'peserta_kkn', 'peserta_kkn_status_index', ['status']);
        $this->addIndexIfMissing($schema, 'peserta_kkn', 'peserta_kkn_period_id_index', ['period_id']);
        $this->addIndexIfMissing($schema, 'peserta_kkn', 'peserta_kkn_kelompok_id_index', ['kelompok_id']);
        $this->addIndexIfMissing($schema, 'peserta_kkn', 'peserta_kkn_mahasiswa_id_index', ['mahasiswa_id']);

        $this->addIndexIfMissing($schema, 'kegiatan_kkn', 'kegiatan_kkn_status_index', ['status']);
        $this->addIndexIfMissing($schema, 'kegiatan_kkn', 'kegiatan_kkn_mahasiswa_id_index', ['mahasiswa_id']);
        $this->addIndexIfMissing($schema, 'kegiatan_kkn', 'kegiatan_kkn_kelompok_id_index', ['kelompok_id']);
        $this->addIndexIfMissing($schema, 'kegiatan_kkn', 'kegiatan_kkn_date_index', ['date']);

        $this->addIndexIfMissing($schema, 'nilai_kkn', 'nilai_kkn_user_id_index', ['user_id']);
        $this->addIndexIfMissing($schema, 'nilai_kkn', 'nilai_kkn_kelompok_id_index', ['kelompok_id']);
        $this->addIndexIfMissing($schema, 'nilai_kkn', 'nilai_kkn_letter_grade_index', ['letter_grade']);
        $this->addIndexIfMissing($schema, 'nilai_kkn', 'nilai_kkn_is_finalized_index', ['is_finalized']);
    }

    public function down(): void
    {
        $schema = Schema::connection('kkn');

        $this->dropIndexIfExists($schema, 'peserta_kkn', 'peserta_kkn_status_index');
        $this->dropIndexIfExists($schema, 'peserta_kkn', 'peserta_kkn_period_id_index');
        $this->dropIndexIfExists($schema, 'peserta_kkn', 'peserta_kkn_kelompok_id_index');
        $this->dropIndexIfExists($schema, 'peserta_kkn', 'peserta_kkn_mahasiswa_id_index');

        $this->dropIndexIfExists($schema, 'kegiatan_kkn', 'kegiatan_kkn_status_index');
        $this->dropIndexIfExists($schema, 'kegiatan_kkn', 'kegiatan_kkn_mahasiswa_id_index');
        $this->dropIndexIfExists($schema, 'kegiatan_kkn', 'kegiatan_kkn_kelompok_id_index');
        $this->dropIndexIfExists($schema, 'kegiatan_kkn', 'kegiatan_kkn_date_index');

        $this->dropIndexIfExists($schema, 'nilai_kkn', 'nilai_kkn_user_id_index');
        $this->dropIndexIfExists($schema, 'nilai_kkn', 'nilai_kkn_kelompok_id_index');
        $this->dropIndexIfExists($schema, 'nilai_kkn', 'nilai_kkn_letter_grade_index');
        $this->dropIndexIfExists($schema, 'nilai_kkn', 'nilai_kkn_is_finalized_index');
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
