<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kelompok_kkn', function (Blueprint $table) {
            $table->string('poster_potensi_desa_path')->nullable()->after('status');
            $table->string('poster_potensi_desa_name')->nullable()->after('poster_potensi_desa_path');
            $table->string('poster_potensi_desa_type', 50)->nullable()->after('poster_potensi_desa_name');
        });
    }

    public function down(): void
    {
        Schema::table('kelompok_kkn', function (Blueprint $table) {
            $table->dropColumn(['poster_potensi_desa_path', 'poster_potensi_desa_name', 'poster_potensi_desa_type']);
        });
    }
};
