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
            $table->string('kkn_type')->nullable()->index();
            $table->unique(['kkn_type', 'config_key'], 'uk_kkn_type_config_key');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('kkn')->table('konfigurasi_penilaian', function (Blueprint $table) {
            $table->dropUnique('uk_kkn_type_config_key');
            $table->dropColumn('kkn_type');
        });
    }
};
