<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add composite indexes for query performance optimization.
     */
    public function up(): void
    {
        Schema::table('peserta_kkn', function (Blueprint $table) {
            $table->index(['period_id', 'status'], 'idx_peserta_period_status');
            $table->index(['mahasiswa_id', 'period_id'], 'idx_peserta_mahasiswa_period');
        });

        Schema::table('kegiatan_kkn', function (Blueprint $table) {
            $table->index(['kelompok_id', 'date'], 'idx_kegiatan_kelompok_date');
        });

        Schema::table('nilai_kkn', function (Blueprint $table) {
            $table->index(['kelompok_id', 'is_finalized'], 'idx_nilai_kelompok_finalized');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('peserta_kkn', function (Blueprint $table) {
            $table->dropIndex('idx_peserta_period_status');
            $table->dropIndex('idx_peserta_mahasiswa_period');
        });

        Schema::table('kegiatan_kkn', function (Blueprint $table) {
            $table->dropIndex('idx_kegiatan_kelompok_date');
        });

        Schema::table('nilai_kkn', function (Blueprint $table) {
            $table->dropIndex('idx_nilai_kelompok_finalized');
        });
    }
};
