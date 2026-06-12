<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monitoring_dpl', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dpl_id')->constrained('dosen')->cascadeOnDelete();
            $table->foreignId('kelompok_id')->constrained('kelompok_kkn')->cascadeOnDelete();
            $table->foreignId('periode_id')->constrained('periode')->cascadeOnDelete();
            $table->date('tanggal_kunjungan');
            $table->text('permasalahan');
            $table->text('solusi');
            $table->text('catatan_tambahan')->nullable();
            $table->timestamps();

            $table->index(['dpl_id', 'tanggal_kunjungan']);
            $table->index(['kelompok_id', 'tanggal_kunjungan']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monitoring_dpl');
    }
};
