<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Enforce that angkatan number (periode.periode) is unique per jenis KKN.
 * e.g. KKN Reguler angkatan 59 and KKN Tematik angkatan 10 can coexist,
 * but two KKN Reguler angkatan 59 cannot.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('periode', function (Blueprint $table) {
            $table->unique(['jenis_kkn_id', 'periode'], 'periode_jenis_kkn_angkatan_unique');
        });
    }

    public function down(): void
    {
        Schema::table('periode', function (Blueprint $table) {
            $table->dropUnique('periode_jenis_kkn_angkatan_unique');
        });
    }
};
