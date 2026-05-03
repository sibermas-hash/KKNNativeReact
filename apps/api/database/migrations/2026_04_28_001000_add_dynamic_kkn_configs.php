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
        Schema::table('jenis_kkn', function (Blueprint $table) {
            if (! Schema::hasColumn('jenis_kkn', 'requirements_config')) {
                $table->json('requirements_config')->nullable()->after('required_documents');
            }
            if (! Schema::hasColumn('jenis_kkn', 'attendance_config')) {
                $table->json('attendance_config')->nullable()->after('requirements_config');
            }
        });

        Schema::table('periode', function (Blueprint $table) {
            if (! Schema::hasColumn('periode', 'settings_override')) {
                $table->json('settings_override')->nullable()->after('name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('jenis_kkn', function (Blueprint $table) {
            if (Schema::hasColumn('jenis_kkn', 'attendance_config')) {
                $table->dropColumn('attendance_config');
            }
            if (Schema::hasColumn('jenis_kkn', 'requirements_config')) {
                $table->dropColumn('requirements_config');
            }
        });

        Schema::table('periode', function (Blueprint $table) {
            if (Schema::hasColumn('periode', 'settings_override')) {
                $table->dropColumn('settings_override');
            }
        });
    }
};
