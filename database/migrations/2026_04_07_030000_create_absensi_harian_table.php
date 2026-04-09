<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('absensi_harian', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswa')->cascadeOnDelete();
            $table->foreignId('kelompok_id')->constrained('kelompok_kkn')->cascadeOnDelete();
            $table->date('tanggal');
            $table->enum('status', ['hadir', 'izin', 'tanpa_keterangan'])->default('hadir');
            $table->foreignId('izin_id')->nullable()->constrained('izin_meninggalkan')->nullOnDelete();
            $table->timestamps();

            $table->unique(['mahasiswa_id', 'tanggal']);
            $table->index(['kelompok_id', 'tanggal']);
            $table->index(['status', 'tanggal']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('absensi_harian');
    }
};
