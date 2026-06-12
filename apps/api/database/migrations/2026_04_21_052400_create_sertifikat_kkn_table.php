<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sertifikat_kkn', function (Blueprint $table) {
            $table->id();

            // Relasi utama
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('periode_id')->constrained('periode')->cascadeOnDelete();
            $table->foreignId('nilai_kkn_id')->nullable()->constrained('nilai_kkn')->nullOnDelete();
            $table->foreignId('kelompok_id')->nullable()->constrained('kelompok_kkn')->nullOnDelete();

            // Identitas sertifikat
            $table->string('certificate_number')->unique();
            $table->string('verification_token', 32)->unique();

            // Data snapshot (agar sertifikat tetap valid meskipun data asli berubah)
            $table->string('nama_mahasiswa');
            $table->string('nim');
            $table->string('nama_prodi')->nullable();
            $table->string('nama_fakultas')->nullable();
            $table->string('lokasi_kkn')->nullable();
            $table->decimal('total_score', 5, 2)->nullable();
            $table->string('letter_grade', 5)->nullable();

            // Status & metadata
            $table->timestamp('issued_at');
            $table->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('revoked_at')->nullable();
            $table->string('revoke_reason')->nullable();
            $table->foreignId('revoked_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            // Indexes
            $table->index(['user_id', 'periode_id']);
            $table->index('issued_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sertifikat_kkn');
    }
};
