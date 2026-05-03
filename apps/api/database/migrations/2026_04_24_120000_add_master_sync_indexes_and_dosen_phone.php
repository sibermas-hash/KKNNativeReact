<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('dosen') && ! Schema::hasColumn('dosen', 'phone')) {
            Schema::table('dosen', function (Blueprint $table) {
                $table->string('phone', 20)->nullable();
            });
        }

        $this->addIndexIfPossible('fakultas', 'master_id', 'fakultas_master_id_idx');
        $this->addIndexIfPossible('fakultas', 'master_synced_at', 'fakultas_master_synced_at_idx');
        $this->addIndexIfPossible('prodi', 'master_id', 'prodi_master_id_idx');
        $this->addIndexIfPossible('prodi', 'master_synced_at', 'prodi_master_synced_at_idx');
        $this->addIndexIfPossible('dosen', 'master_id', 'dosen_master_id_idx');
        $this->addIndexIfPossible('dosen', 'master_synced_at', 'dosen_master_synced_at_idx');
        $this->addIndexIfPossible('mahasiswa', 'master_id', 'mahasiswa_master_id_idx');
        $this->addIndexIfPossible('mahasiswa', 'master_synced_at', 'mahasiswa_master_synced_at_idx');
    }

    public function down(): void
    {
        $this->dropIndexIfExists('mahasiswa', 'mahasiswa_master_synced_at_idx');
        $this->dropIndexIfExists('mahasiswa', 'mahasiswa_master_id_idx');
        $this->dropIndexIfExists('dosen', 'dosen_master_synced_at_idx');
        $this->dropIndexIfExists('dosen', 'dosen_master_id_idx');
        $this->dropIndexIfExists('prodi', 'prodi_master_synced_at_idx');
        $this->dropIndexIfExists('prodi', 'prodi_master_id_idx');
        $this->dropIndexIfExists('fakultas', 'fakultas_master_synced_at_idx');
        $this->dropIndexIfExists('fakultas', 'fakultas_master_id_idx');
    }

    private function addIndexIfPossible(string $tableName, string $column, string $indexName): void
    {
        if (! Schema::hasTable($tableName) || ! Schema::hasColumn($tableName, $column)) {
            return;
        }

        try {
            Schema::table($tableName, function (Blueprint $table) use ($column, $indexName) {
                $table->index($column, $indexName);
            });
        } catch (Throwable) {
            // Ignore if the index already exists in this environment.
        }
    }

    private function dropIndexIfExists(string $tableName, string $indexName): void
    {
        if (! Schema::hasTable($tableName)) {
            return;
        }

        try {
            Schema::table($tableName, function (Blueprint $table) use ($indexName) {
                $table->dropIndex($indexName);
            });
        } catch (Throwable) {
            // Ignore if the index was never created on this environment.
        }
    }
};
