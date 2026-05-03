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
        Schema::table('periode', function (Blueprint $table) {
            // Hapus kolom angkatan yang sudah tidak digunakan
            $table->dropColumn('angkatan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('periode', function (Blueprint $table) {
            // Kembalikan kolom angkatan jika rollback
            $table->integer('angkatan')->nullable();
        });
    }
};
