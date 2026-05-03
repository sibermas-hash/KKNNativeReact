<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations - add soft deletes to critical audit tables.
     *
     * Tables that need soft deletes for audit trail:
     * - kegiatan_kkn (daily activity logs)
     * - program_kerja (work prodi)
     * - nilai_kkn (grades/scores)
     * - absensi_harian (daily attendance)
     * - monitoring_dpl (DPL monitoring logs)
     * - izin_meninggalkan (leave permits)
     */
    public function up(): void
    {
        $tables = [
            'kegiatan_kkn',
            'program_kerja',
            'nilai_kkn',
            'absensi_harian',
            'monitoring_dpl',
            'izin_meninggalkan',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && ! Schema::hasColumn($table, 'deleted_at')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->softDeletes();
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'kegiatan_kkn',
            'program_kerja',
            'nilai_kkn',
            'absensi_harian',
            'monitoring_dpl',
            'izin_meninggalkan',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'deleted_at')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->dropSoftDeletes();
                });
            }
        }
    }
};
