<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        $schema = Schema::connection('kkn');

        // 1. Mahasiswa: Index for faculty-based filtering and searches
        $this->addIndexIfMissing($schema, 'mahasiswa', 'mahasiswa_faculty_program_idx', ['faculty_id', 'program_id']);
        
        // 2. Lokasi: Index for geographical scoping
        $this->addIndexIfMissing($schema, 'lokasi', 'lokasi_faculty_district_idx', ['faculty_id', 'district_id']);

        // 3. Kelompok KKN: Index for location-based grouping
        $this->addIndexIfMissing($schema, 'kelompok_kkn', 'kelompok_location_status_idx', ['location_id', 'status']);

        // 4. Log Audit: High volume forensic searches
        $this->addIndexIfMissing($schema, 'log_audit', 'log_audit_user_action_created_idx', ['user_id', 'action', 'created_at']);

        // 5. Nilai KKN: Faster lookup for finalization status
        $this->addIndexIfMissing($schema, 'nilai_kkn', 'nilai_user_finalized_idx', ['user_id', 'is_finalized']);
    }

    public function down(): void
    {
        $schema = Schema::connection('kkn');

        $this->dropIndexIfExists($schema, 'mahasiswa', 'mahasiswa_faculty_program_idx');
        $this->dropIndexIfExists($schema, 'lokasi', 'lokasi_faculty_district_idx');
        $this->dropIndexIfExists($schema, 'kelompok_kkn', 'kelompok_location_status_idx');
        $this->dropIndexIfExists($schema, 'log_audit', 'log_audit_user_action_created_idx');
        $this->dropIndexIfExists($schema, 'nilai_kkn', 'nilai_user_finalized_idx');
    }

    private function addIndexIfMissing(
        \Illuminate\Database\Schema\Builder $schema,
        string $table,
        string $indexName,
        array $columns
    ): void {
        if (! $schema->hasTable($table)) {
            return;
        }

        if ($this->hasIndex($schema, $table, $indexName, $columns)) {
            return;
        }

        $schema->table($table, function (Blueprint $tableObj) use ($columns, $indexName) {
            $tableObj->index($columns, $indexName);
        });
    }

    private function dropIndexIfExists(
        \Illuminate\Database\Schema\Builder $schema,
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
        \Illuminate\Database\Schema\Builder $schema,
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
