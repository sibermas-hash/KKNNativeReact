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
        Schema::connection('kkn')->table('konfigurasi_penilaian', function (Blueprint $table) {
            // Hapus index unik lama yang hanya mengunci config_key
            // Nama index di database PostgreSQL biasanya: grading_configs_config_key_unique
            $table->dropUnique('grading_configs_config_key_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('kkn')->table('konfigurasi_penilaian', function (Blueprint $table) {
            $table->unique('config_key', 'grading_configs_config_key_unique');
        });
    }
};
