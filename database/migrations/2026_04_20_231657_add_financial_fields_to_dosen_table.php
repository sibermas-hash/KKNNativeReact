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
        Schema::table('dosen', function (Blueprint $table) {
            $table->string('golongan', 50)->nullable()->after('jabatan');
            $table->string('no_rekening', 50)->nullable()->after('golongan');
            $table->string('nama_bank', 100)->nullable()->after('no_rekening');
            $table->string('npwp', 50)->nullable()->after('nama_bank');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dosen', function (Blueprint $table) {
            $table->dropColumn(['golongan', 'no_rekening', 'nama_bank', 'npwp']);
        });
    }
};
