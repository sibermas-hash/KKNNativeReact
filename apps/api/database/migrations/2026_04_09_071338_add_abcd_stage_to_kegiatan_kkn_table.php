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
        Schema::table('kegiatan_kkn', function (Blueprint $table) {
            $table->string('abcd_stage')->nullable()->after('title')->comment('Tahapan ABCD sesuai Panduan KKN 56');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kegiatan_kkn', function (Blueprint $table) {
            $table->dropColumn('abcd_stage');
        });
    }
};
