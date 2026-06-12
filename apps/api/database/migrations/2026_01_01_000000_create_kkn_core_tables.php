<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fakultas', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();
            $table->string('nama', 100);
            $table->timestamps();
        });

        Schema::create('prodi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fakultas_id')->constrained('fakultas')->cascadeOnDelete();
            $table->string('code', 10)->unique();
            $table->string('nama', 100);
            $table->timestamps();
        });

        Schema::create('tahun_akademik', function (Blueprint $table) {
            $table->id();
            $table->string('year', 20)->unique();
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });

        Schema::create('periode', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('tahun_akademik')->cascadeOnDelete();
            $table->string('name', 100);
            $table->date('start_date');
            $table->date('end_date');
            $table->date('registration_start');
            $table->date('registration_end');
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });

        Schema::create('dosen', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('nip', 20)->unique();
            $table->string('nama', 100);
            $table->foreignId('fakultas_id')->constrained('fakultas')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('mahasiswa', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('nim', 20)->unique();
            $table->string('nama', 100);
            $table->foreignId('fakultas_id')->constrained('fakultas')->cascadeOnDelete();
            $table->foreignId('prodi_id')->constrained('prodi')->cascadeOnDelete();
            $table->year('batch_year');
            $table->string('gender', 1)->nullable();
            $table->string('birth_place', 100)->nullable();
            $table->date('birth_date')->nullable();
            $table->string('university', 100)->default('Universitas UIN SAIZU Purwokerto');
            $table->integer('sks_completed')->default(0);
            $table->decimal('gpa', 3, 2)->default(0.00);
            $table->string('health_certificate_path')->nullable();
            $table->string('parent_permission_path')->nullable();
            $table->boolean('is_bta_ppi_passed')->default(false);
            $table->timestamps();
        });

        Schema::create('lokasi', function (Blueprint $table) {
            $table->id();
            $table->integer('province_id')->nullable();
            $table->integer('regency_id')->nullable();
            $table->string('regency_name', 100)->nullable();
            $table->integer('district_id')->nullable();
            $table->string('district_name', 100)->nullable();
            $table->string('village_code', 20)->nullable();
            $table->string('village_name', 100);
            $table->text('address')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->integer('capacity')->default(0);
            $table->timestamps();
        });

        Schema::create('kelompok_kkn', function (Blueprint $table) {
            $table->id();
            $table->foreignId('periode_id')->constrained('periode')->cascadeOnDelete();
            $table->foreignId('location_id')->constrained('lokasi')->cascadeOnDelete();
            $table->foreignId('dpl_id')->nullable()->constrained('dosen')->nullOnDelete();
            $table->string('code', 20)->unique();
            $table->string('nama_kelompok', 100);
            $table->string('token', 10)->nullable()->unique();
            $table->integer('capacity')->default(10);
            $table->string('status', 20)->default('active');
            $table->timestamps();
        });

        Schema::create('peserta_kkn', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswa')->cascadeOnDelete();
            $table->foreignId('periode_id')->constrained('periode')->cascadeOnDelete();
            $table->foreignId('kelompok_id')->nullable()->constrained('kelompok_kkn')->nullOnDelete();
            $table->string('status', 20)->default('pending');
            $table->string('role')->default('Anggota');
            $table->text('notes')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('registration_date')->useCurrent();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('kegiatan_kkn', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswa')->cascadeOnDelete();
            $table->foreignId('kelompok_id')->constrained('kelompok_kkn')->cascadeOnDelete();
            $table->date('date');
            $table->string('title', 200);
            $table->text('activity');
            $table->string('status', 20)->default('submitted');
            $table->timestamps();
        });

        Schema::create('program_kerja', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kelompok_id')->constrained('kelompok_kkn')->cascadeOnDelete();
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('laporan_akhir', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswa')->cascadeOnDelete();
            $table->foreignId('kelompok_id')->constrained('kelompok_kkn')->cascadeOnDelete();
            $table->string('title', 200);
            $table->string('status', 20)->default('submitted');
            $table->timestamps();
        });

        Schema::create('evaluasi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswa')->cascadeOnDelete();
            $table->foreignId('kelompok_id')->constrained('kelompok_kkn')->cascadeOnDelete();
            $table->decimal('total_score', 5, 2)->nullable();
            $table->timestamps();
        });

        Schema::create('item_evaluasi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evaluasi_id')->constrained('evaluasi')->cascadeOnDelete();
            $table->string('criterion', 100);
            $table->decimal('score', 5, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_evaluasi');
        Schema::dropIfExists('evaluasi');
        Schema::dropIfExists('laporan_akhir');
        Schema::dropIfExists('program_kerja');
        Schema::dropIfExists('kegiatan_kkn');
        Schema::dropIfExists('peserta_kkn');
        Schema::dropIfExists('kelompok_kkn');
        Schema::dropIfExists('lokasi');
        Schema::dropIfExists('mahasiswa');
        Schema::dropIfExists('dosen');
        Schema::dropIfExists('periode');
        Schema::dropIfExists('tahun_akademik');
        Schema::dropIfExists('prodi');
        Schema::dropIfExists('fakultas');
    }
};
