<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function indexExists(string $table, string $index): bool
    {
        return \Illuminate\Support\Facades\DB::select(
            "SELECT 1 FROM pg_indexes WHERE tablename = ? AND indexname = ?",
            [$table, $index]
        ) !== [];
    }

    public function up(): void
    {
        $indexes = [
            'kegiatan_kkn' => [
                ['idx_kegiatan_mahasiswa_kelompok', ['mahasiswa_id', 'kelompok_id']],
                ['idx_kegiatan_kelompok_date', ['kelompok_id', 'date']],
                ['idx_kegiatan_kelompok_status', ['kelompok_id', 'status']],
            ],
            'peserta_kkn' => [
                ['idx_peserta_periode_status', ['periode_id', 'status']],
                ['idx_peserta_periode_kelompok', ['periode_id', 'kelompok_id']],
            ],
            'nilai_kkn' => [
                ['idx_nilai_kelompok_finalized', ['kelompok_id', 'is_finalized']],
            ],
        ];

        foreach ($indexes as $table => $tableIndexes) {
            Schema::table($table, function (Blueprint $t) use ($table, $tableIndexes) {
                foreach ($tableIndexes as [$name, $cols]) {
                    if (!$this->indexExists($table, $name)) {
                        $t->index($cols, $name);
                    }
                }
            });
        }

        if (Schema::hasTable('sync_logs') && !$this->indexExists('sync_logs', 'idx_sync_logs_entity_created')) {
            Schema::table('sync_logs', fn (Blueprint $t) =>
                $t->index(['entity_type', 'created_at'], 'idx_sync_logs_entity_created')
            );
        }
    }

    public function down(): void
    {
        Schema::table('kegiatan_kkn', function (Blueprint $table) {
            $table->dropIndex('idx_kegiatan_mahasiswa_kelompok');
            $table->dropIndex('idx_kegiatan_kelompok_date');
            $table->dropIndex('idx_kegiatan_kelompok_status');
        });

        Schema::table('peserta_kkn', function (Blueprint $table) {
            $table->dropIndex('idx_peserta_periode_status');
            $table->dropIndex('idx_peserta_periode_kelompok');
        });

        Schema::table('nilai_kkn', function (Blueprint $table) {
            $table->dropIndex('idx_nilai_kelompok_finalized');
        });

        if (Schema::hasTable('sync_logs')) {
            Schema::table('sync_logs', function (Blueprint $table) {
                $table->dropIndex('idx_sync_logs_entity_created');
            });
        }
    }
};
