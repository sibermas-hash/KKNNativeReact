<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tablesWithSoftDeletes = [
            'fakultas',
            'laporan',
            'laporan_akhir',
            'lokasi',
            'attendances',
            'location_dispensations',
            'kelompok_kkn',
            'peserta_kkn',
            'periode',
        ];

        foreach ($tablesWithSoftDeletes as $tableName) {
            if (Schema::hasTable($tableName) && ! Schema::hasColumn($tableName, 'deleted_at')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->softDeletes();
                });
            }
        }
    }

    public function down(): void
    {
        $tables = ['fakultas', 'laporan', 'laporan_akhir', 'lokasi', 'attendances', 'location_dispensations', 'kelompok_kkn', 'peserta_kkn', 'periode'];

        foreach ($tables as $table) {
            if (Schema::hasColumn($table, 'deleted_at')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->dropSoftDeletes();
                });
            }
        }
    }
};
