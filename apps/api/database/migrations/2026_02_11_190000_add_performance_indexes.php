<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Performance optimization: Add critical indexes for frequently queried columns.
 *
 * These indexes target:
 * - Dashboard aggregate queries (student/report counts by status)
 * - Grading lookups (student + group composite)
 * - Daily report filtering (group + status for DPL approval workflow)
 * - Registration filtering (student + period, status)
 */
return new class extends Migration
{
    public function up(): void
    {
        // KKN Scores - critical for grade lookups
        Schema::table('nilai_kkn', function (Blueprint $table) {
            $table->index(['mahasiswa_id', 'kelompok_id'], 'idx_nilai_kkn_student_group');
            $table->index('is_finalized', 'idx_nilai_kkn_finalized');
        });

        // Daily Reports - DPL approval workflow
        Schema::table('kegiatan_kkn', function (Blueprint $table) {
            $table->index(['kelompok_id', 'status'], 'idx_kegiatan_kkn_group_status');
            $table->index(['mahasiswa_id', 'status'], 'idx_kegiatan_kkn_student_status');
            $table->index('date', 'idx_kegiatan_kkn_date');
        });

        // Registrations - student period lookups
        Schema::table('peserta_kkn', function (Blueprint $table) {
            $table->index(['mahasiswa_id', 'periode_id'], 'idx_peserta_kkn_student_period');
            $table->index('status', 'idx_peserta_kkn_status');
        });

        // Evaluations - student group lookups
        Schema::table('evaluasi', function (Blueprint $table) {
            $table->index(['mahasiswa_id', 'kelompok_id'], 'idx_evaluasi_student_group');
        });

        // Groups - period lookups for filtered views
        Schema::table('kelompok_kkn', function (Blueprint $table) {
            $table->index(['periode_id', 'status'], 'idx_kelompok_kkn_period_status');
        });
    }

    public function down(): void
    {
        Schema::table('nilai_kkn', function (Blueprint $table) {
            $table->dropIndex('idx_nilai_kkn_student_group');
            $table->dropIndex('idx_nilai_kkn_finalized');
        });

        Schema::table('kegiatan_kkn', function (Blueprint $table) {
            $table->dropIndex('idx_kegiatan_kkn_group_status');
            $table->dropIndex('idx_kegiatan_kkn_student_status');
            $table->dropIndex('idx_kegiatan_kkn_date');
        });

        Schema::table('peserta_kkn', function (Blueprint $table) {
            $table->dropIndex('idx_peserta_kkn_student_period');
            $table->dropIndex('idx_peserta_kkn_status');
        });

        Schema::table('evaluasi', function (Blueprint $table) {
            $table->dropIndex('idx_evaluasi_student_group');
        });

        Schema::table('kelompok_kkn', function (Blueprint $table) {
            $table->dropIndex('idx_kelompok_kkn_period_status');
        });
    }
};
