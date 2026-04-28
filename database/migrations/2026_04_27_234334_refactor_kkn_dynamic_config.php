<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Refactor jenis_kkn to support Hybrid Requirements & Attendance Rules
        Schema::table('jenis_kkn', function (Blueprint $table) {
            // Jantung Aturan: Menyimpan daftar syarat (Upload vs DB Check)
            $table->json('requirements_config')->nullable()->after('description')
                ->comment('Hybrid requirements: [{name, type: "upload|db_check", field, min_value}]');

            // Aturan Absensi: Geofencing, Radius, Lokasi Rujukan
            $table->json('attendance_config')->nullable()->after('requirements_config')
                ->comment('Attendance rules: {radius_check: bool, radius_meter, location_source: "posko|domisili", require_photo: bool}');
        });

        // 2. Refactor periode to support Configuration Overrides (Instance Logic)
        Schema::table('periode', function (Blueprint $table) {
            // Wadah Data + Override Aturan
            $table->json('settings_override')->nullable()->after('theme')
                ->comment('Period-specific overrides for requirements or attendance rules');
        });
    }

    public function down(): void
    {
        Schema::table('jenis_kkn', function (Blueprint $table) {
            $table->dropColumn(['requirements_config', 'attendance_config']);
        });

        Schema::table('periode', function (Blueprint $table) {
            $table->dropColumn('settings_override');
        });
    }
};
