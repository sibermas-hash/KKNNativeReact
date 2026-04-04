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
        Schema::table('peserta_kkn', function (Blueprint $table) {
            $table->index(['period_id', 'mahasiswa_id', 'status'], 'peserta_kkn_hot_path_composite_idx');
        });

        Schema::table('kegiatan_kkn', function (Blueprint $table) {
            $table->index(['mahasiswa_id', 'kelompok_id', 'date'], 'kegiatan_performance_path_idx');
        });

        Schema::table('nilai_kkn', function (Blueprint $table) {
            $table->index(['user_id', 'kelompok_id', 'is_finalized'], 'nilai_finalization_path_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('peserta_kkn', function (Blueprint $table) {
            $table->dropIndex('peserta_kkn_hot_path_composite_idx');
        });

        Schema::table('kegiatan_kkn', function (Blueprint $table) {
            $table->dropIndex('kegiatan_performance_path_idx');
        });

        Schema::table('nilai_kkn', function (Blueprint $table) {
            $table->dropIndex('nilai_finalization_path_idx');
        });
    }
};
