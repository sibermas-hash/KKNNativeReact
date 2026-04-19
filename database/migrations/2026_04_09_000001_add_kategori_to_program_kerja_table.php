<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('program_kerja', function (Blueprint $table) {
            $table->string('kategori', 30)->default('pendukung')->after('abcd_stage');
        });
    }

    public function down(): void
    {
        Schema::table('program_kerja', function (Blueprint $table) {
            $table->dropColumn('kategori');
        });
    }
};
