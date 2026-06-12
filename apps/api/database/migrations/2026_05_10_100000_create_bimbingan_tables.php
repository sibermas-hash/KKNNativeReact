<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Sistem Bimbingan Online — tabel sesi bimbingan DPL ↔ kelompok.
     *
     * Target: min 4 sesi selesai per kelompok per periode.
     * DPL membuat sesi dengan jadwal + agenda. Mahasiswa hadir + melihat notulensi.
     * Notulensi di-write oleh DPL setelah sesi selesai.
     */
    public function up(): void
    {
        Schema::create('bimbingan_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kelompok_id')->constrained('kelompok_kkn')->cascadeOnDelete();
            $table->foreignId('dosen_id')->constrained('dosen')->cascadeOnDelete();
            $table->foreignId('periode_id')->constrained('periode')->cascadeOnDelete();

            $table->dateTime('scheduled_at');
            $table->unsignedSmallInteger('duration_minutes')->default(60);
            $table->string('topik', 255);
            $table->text('agenda')->nullable();
            $table->string('meeting_link', 500)->nullable(); // Zoom, Meet, WA call, offline
            $table->string('location', 255)->nullable(); // Ruang DPL / via online
            $table->enum('mode', ['online', 'offline', 'hybrid'])->default('online');

            $table->enum('status', ['scheduled', 'ongoing', 'completed', 'cancelled'])->default('scheduled');
            $table->text('notulensi')->nullable(); // Ringkasan hasil bimbingan (by DPL setelah sesi)
            $table->text('action_items')->nullable(); // Tindak lanjut mahasiswa
            $table->timestamp('completed_at')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['kelompok_id', 'periode_id']);
            $table->index(['dosen_id', 'periode_id']);
            $table->index('scheduled_at');
            $table->index('status');
        });

        Schema::create('bimbingan_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('bimbingan_sessions')->cascadeOnDelete();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswa')->cascadeOnDelete();

            $table->enum('status', ['hadir', 'tidak_hadir', 'izin'])->default('tidak_hadir');
            $table->text('note')->nullable(); // komentar mahasiswa
            $table->timestamp('marked_at')->nullable();

            $table->timestamps();

            $table->unique(['session_id', 'mahasiswa_id']);
            $table->index('session_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bimbingan_attendances');
        Schema::dropIfExists('bimbingan_sessions');
    }
};
