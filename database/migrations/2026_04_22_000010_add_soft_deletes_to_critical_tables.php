<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $existingTables = DB::select('SELECT tablename FROM pg_tables WHERE schemaname=?', ['public']);
        $tableNames = array_map(fn($t) => $t->tablename, $existingTables);
        
        $tablesWithSoftDeletes = [
            'fakultas' => 'fakultas',
            'laporan' => 'laporan',
            'laporan_akhir' => 'laporan_akhir',
            'lokasi' => 'lokasi',
            'attendance' => 'attendances',
            'location_dispensation' => 'location_dispensations',
            'kelompok_kkn' => 'kelompok_kkn',
            'peserta_kkn' => 'peserta_kkn',
            'periode' => 'periode',
        ];

        foreach ($tablesWithSoftDeletes as $dbName => $modelTable) {
            if (in_array($dbName, $tableNames) && !Schema::hasColumn($modelTable, 'deleted_at')) {
                Schema::table($modelTable, function (Blueprint $table) {
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