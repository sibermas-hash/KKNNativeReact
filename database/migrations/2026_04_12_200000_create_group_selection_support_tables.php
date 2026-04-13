<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('antrian_kkn', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswa')->cascadeOnDelete();
            $table->foreignId('period_id')->constrained('periode')->cascadeOnDelete();
            $table->unsignedInteger('posisi_antrian')->nullable();
            $table->enum('status', ['menunggu', 'dalam_kelompok', 'selesai'])->default('menunggu');
            $table->unsignedInteger('penalti_poin')->default(0);
            $table->unsignedInteger('pindah_count')->default(0);
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('last_left_group_at')->nullable();
            $table->timestamps();

            $table->unique(['mahasiswa_id', 'period_id'], 'antrian_kkn_mahasiswa_period_unique');
            $table->index(['period_id', 'status'], 'antrian_kkn_period_status_idx');
        });

        Schema::create('slot_terkunci', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kelompok_id')->constrained('kelompok_kkn')->cascadeOnDelete();
            $table->enum('tipe_slot', ['fakultas', 'prodi']);
            $table->foreignId('fakultas_id')->nullable()->constrained('fakultas')->nullOnDelete();
            $table->foreignId('prodi_id')->nullable()->constrained('prodi')->nullOnDelete();
            $table->unsignedInteger('kuota_slot');
            $table->timestamps();

            $table->index(['kelompok_id', 'tipe_slot'], 'slot_terkunci_kelompok_tipe_idx');
        });

        Schema::table('peserta_kkn', function (Blueprint $table) {
            $table->timestamp('joined_group_at')->nullable()->after('registration_date');
            $table->timestamp('group_locked_until')->nullable()->after('joined_group_at');
            $table->index(['kelompok_id', 'status'], 'peserta_kkn_kelompok_status_idx');
        });
    }

    public function down(): void
    {
        Schema::table('peserta_kkn', function (Blueprint $table) {
            $table->dropIndex('peserta_kkn_kelompok_status_idx');
            $table->dropColumn(['joined_group_at', 'group_locked_until']);
        });

        Schema::dropIfExists('slot_terkunci');
        Schema::dropIfExists('antrian_kkn');
    }
};
