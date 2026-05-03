<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rekapitulasi_kegiatan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kelompok_id')->constrained('kelompok_kkn')->cascadeOnDelete();
            $table->foreignId('program_kerja_id')->nullable()->constrained('program_kerja')->nullOnDelete();
            $table->string('uraian_kegiatan', 255);
            $table->string('satuan', 50)->default('kegiatan');
            $table->integer('volume')->default(1);
            // Sumber dana (dalam ribuan rupiah)
            $table->integer('swadaya_mhs')->default(0)->comment('Swadaya Mahasiswa');
            $table->integer('swadaya_masyarakat')->default(0)->comment('Swadaya Masyarakat');
            $table->integer('bantuan_pemerintah')->default(0)->comment('Bantuan Pemerintah');
            $table->integer('donatur_lain')->default(0)->comment('Donatur/Lain-lain');
            $table->integer('jumlah')->default(0)->comment('Total dana');
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rekapitulasi_kegiatan');
    }
};
