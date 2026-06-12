<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add dpl_periode_id to kelompok_kkn and soft deletes to core tables.
     * Existing dpl_id is kept for backward compatibility during transition.
     */
    public function up(): void
    {
        // 1. Add dpl_periode_id to kelompok_kkn (alongside existing dpl_id)
        Schema::table('kelompok_kkn', function (Blueprint $table) {
            $table->foreignId('dpl_periode_id')->nullable()->after('dpl_id')
                ->constrained('dpl_periode')->nullOnDelete();
            $table->softDeletes();
        });

        // 2. Add soft deletes to periode
        Schema::table('periode', function (Blueprint $table) {
            $table->softDeletes();
        });

        // 3. Add soft deletes to peserta_kkn
        Schema::table('peserta_kkn', function (Blueprint $table) {
            $table->softDeletes();
        });

        // 4. Add soft deletes to laporan_akhir
        // NOTE: laporan table already has soft deletes
        Schema::table('laporan_akhir', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kelompok_kkn', function (Blueprint $table) {
            $table->dropConstrainedForeignId('dpl_periode_id');
            $table->dropSoftDeletes();
        });

        Schema::table('periode', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('peserta_kkn', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('laporan_akhir', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
