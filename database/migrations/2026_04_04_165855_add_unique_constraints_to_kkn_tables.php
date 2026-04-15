<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Unique constraint: Mahasiswa hanya bisa daftar 1x per periode
        if (! Schema::hasIndex('peserta_kkn', 'unique_mahasiswa_periode')) {
            Schema::table('peserta_kkn', function (Blueprint $table) {
                $table->unique(['mahasiswa_id', 'period_id'], 'unique_mahasiswa_periode');
            });
        }

        // Unique constraint: DPL tidak bisa assigned 2x ke kelompok yang sama
        if (Schema::hasTable('dpl_kelompok') && ! Schema::hasIndex('dpl_kelompok', 'unique_dpl_kelompok')) {
            Schema::table('dpl_kelompok', function (Blueprint $table) {
                $table->unique(['dosen_id', 'kelompok_kkn_id'], 'unique_dpl_kelompok');
            });
        }

        // Add missing indexes for performance (check if already exist)
        if (! Schema::hasIndex('nilai_kkn', 'idx_nilai_kelompok_finalized')) {
            Schema::table('nilai_kkn', function (Blueprint $table) {
                $table->index(['kelompok_id', 'is_finalized'], 'idx_nilai_kelompok_finalized');
            });
        }

        if (! Schema::hasIndex('laporan_akhir', 'idx_laporan_kelompok_status')) {
            Schema::table('laporan_akhir', function (Blueprint $table) {
                $table->index(['kelompok_id', 'status'], 'idx_laporan_kelompok_status');
            });
        }

        if (! Schema::hasIndex('kegiatan_kkn', 'idx_kegiatan_kelompok_status_date')) {
            Schema::table('kegiatan_kkn', function (Blueprint $table) {
                $table->index(['kelompok_id', 'status', 'date'], 'idx_kegiatan_kelompok_status_date');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('peserta_kkn', function (Blueprint $table) {
            $table->dropUnique('unique_mahasiswa_periode');
        });

        if (Schema::hasTable('dpl_kelompok')) {
            Schema::table('dpl_kelompok', function (Blueprint $table) {
                $table->dropUnique('unique_dpl_kelompok');
            });
        }

        Schema::table('nilai_kkn', function (Blueprint $table) {
            $table->dropIndex('idx_nilai_kelompok_finalized');
        });

        Schema::table('laporan_akhir', function (Blueprint $table) {
            $table->dropIndex('idx_laporan_kelompok_status');
        });

        Schema::table('kegiatan_kkn', function (Blueprint $table) {
            $table->dropIndex('idx_kegiatan_kelompok_status_date');
        });
    }
};
