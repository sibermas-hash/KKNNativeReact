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
        // 1. Rename Core Identity Tables
        Schema::rename('lecturers', 'dosen');
        Schema::table('dosen', function (Blueprint $table) {
            $table->renameColumn('name', 'nama');
        });

        Schema::rename('students', 'mahasiswa');
        Schema::table('mahasiswa', function (Blueprint $table) {
            $table->renameColumn('name', 'nama');
        });

        // 2. Rename KKN Domain Tables
        Schema::rename('groups', 'kelompok_kkn');
        Schema::table('kelompok_kkn', function (Blueprint $table) {
            $table->renameColumn('name', 'nama_kelompok');
            $table->renameColumn('lecturer_id', 'dpl_id');
        });

        Schema::rename('registrations', 'peserta_kkn');
        Schema::table('peserta_kkn', function (Blueprint $table) {
            $table->renameColumn('student_id', 'mahasiswa_id');
            $table->renameColumn('group_id', 'kelompok_id');
        });

        Schema::rename('daily_reports', 'kegiatan_kkn');
        Schema::table('kegiatan_kkn', function (Blueprint $table) {
            $table->renameColumn('student_id', 'mahasiswa_id');
            $table->renameColumn('group_id', 'kelompok_id');
        });

        // 3. Rename Supporting Tables
        Schema::rename('faculties', 'fakultas');
        Schema::table('fakultas', function (Blueprint $table) {
            $table->renameColumn('name', 'nama');
        });

        Schema::rename('programs', 'prodi');
        Schema::table('prodi', function (Blueprint $table) {
            $table->renameColumn('name', 'nama');
        });

        Schema::rename('periods', 'periode');
        Schema::rename('locations', 'lokasi');
        Schema::rename('academic_years', 'tahun_akademik');

        Schema::rename('work_programs', 'program_kerja');
        Schema::table('program_kerja', function (Blueprint $table) {
            $table->renameColumn('group_id', 'kelompok_id');
        });

        Schema::rename('final_reports', 'laporan_akhir');
        Schema::table('laporan_akhir', function (Blueprint $table) {
            $table->renameColumn('student_id', 'mahasiswa_id');
            $table->renameColumn('group_id', 'kelompok_id');
        });

        Schema::rename('kkn_scores', 'nilai_kkn');
        Schema::table('nilai_kkn', function (Blueprint $table) {
            $table->renameColumn('student_id', 'mahasiswa_id');
            $table->renameColumn('group_id', 'kelompok_id');
        });

        Schema::rename('daily_report_files', 'file_kegiatan_kkn');
        Schema::table('file_kegiatan_kkn', function (Blueprint $table) {
            $table->renameColumn('daily_report_id', 'kegiatan_kkn_id');
        });

        Schema::rename('registration_documents', 'dokumen_peserta_kkn');
        Schema::table('dokumen_peserta_kkn', function (Blueprint $table) {
            $table->renameColumn('registration_id', 'peserta_kkn_id');
        });

        Schema::rename('evaluations', 'evaluasi');
        Schema::table('evaluasi', function (Blueprint $table) {
            $table->renameColumn('student_id', 'mahasiswa_id');
            $table->renameColumn('group_id', 'kelompok_id');
        });

        Schema::rename('evaluation_items', 'item_evaluasi');
        Schema::table('item_evaluasi', function (Blueprint $table) {
            $table->renameColumn('evaluation_id', 'evaluasi_id');
        });

        Schema::rename('work_program_proposals', 'proposal_program_kerja');

        Schema::rename('workshops', 'workshop');

        Schema::rename('workshop_participants', 'peserta_workshop');

        Schema::rename('reports', 'laporan');
        Schema::table('laporan', function (Blueprint $table) {
            $table->renameColumn('group_id', 'kelompok_id');
        });

        Schema::rename('user_profiles', 'profil_user');

        Schema::rename('grading_configs', 'konfigurasi_penilaian');

        Schema::rename('audit_logs', 'log_audit');

        Schema::table('proposal_program_kerja', function (Blueprint $table) {
            $table->renameColumn('work_program_id', 'program_kerja_id');
        });

        Schema::table('proposal', function (Blueprint $table) {
            $table->renameColumn('group_id', 'kelompok_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proposal', function (Blueprint $table) {
            $table->renameColumn('kelompok_id', 'group_id');
        });

        Schema::table('proposal_program_kerja', function (Blueprint $table) {
            $table->renameColumn('program_kerja_id', 'work_program_id');
        });

        Schema::rename('log_audit', 'audit_logs');

        Schema::rename('konfigurasi_penilaian', 'grading_configs');

        Schema::rename('profil_user', 'user_profiles');

        Schema::table('laporan', function (Blueprint $table) {
            $table->renameColumn('kelompok_id', 'group_id');
        });
        Schema::rename('laporan', 'reports');

        Schema::rename('peserta_workshop', 'workshop_participants');

        Schema::rename('workshop', 'workshops');

        Schema::rename('proposal_program_kerja', 'work_program_proposals');

        Schema::table('item_evaluasi', function (Blueprint $table) {
            $table->renameColumn('evaluasi_id', 'evaluation_id');
        });
        Schema::rename('item_evaluasi', 'evaluation_items');

        Schema::table('evaluasi', function (Blueprint $table) {
            $table->renameColumn('kelompok_id', 'group_id');
            $table->renameColumn('mahasiswa_id', 'student_id');
        });
        Schema::rename('evaluasi', 'evaluations');

        Schema::table('dokumen_peserta_kkn', function (Blueprint $table) {
            $table->renameColumn('peserta_kkn_id', 'registration_id');
        });
        Schema::rename('dokumen_peserta_kkn', 'registration_documents');

        Schema::table('file_kegiatan_kkn', function (Blueprint $table) {
            $table->renameColumn('kegiatan_kkn_id', 'daily_report_id');
        });
        Schema::rename('file_kegiatan_kkn', 'daily_report_files');

        Schema::table('nilai_kkn', function (Blueprint $table) {
            $table->renameColumn('kelompok_id', 'group_id');
            $table->renameColumn('mahasiswa_id', 'student_id');
        });
        Schema::rename('nilai_kkn', 'kkn_scores');

        Schema::table('laporan_akhir', function (Blueprint $table) {
            $table->renameColumn('kelompok_id', 'group_id');
            $table->renameColumn('mahasiswa_id', 'student_id');
        });
        Schema::rename('laporan_akhir', 'final_reports');

        Schema::table('program_kerja', function (Blueprint $table) {
            $table->renameColumn('kelompok_id', 'group_id');
        });
        Schema::rename('program_kerja', 'work_programs');

        Schema::rename('tahun_akademik', 'academic_years');
        Schema::rename('lokasi', 'locations');
        Schema::rename('periode', 'periods');

        Schema::table('prodi', function (Blueprint $table) {
            $table->renameColumn('nama', 'name');
        });
        Schema::rename('prodi', 'programs');

        Schema::table('fakultas', function (Blueprint $table) {
            $table->renameColumn('nama', 'name');
        });
        Schema::rename('fakultas', 'faculties');

        Schema::table('kegiatan_kkn', function (Blueprint $table) {
            $table->renameColumn('kelompok_id', 'group_id');
            $table->renameColumn('mahasiswa_id', 'student_id');
        });
        Schema::rename('kegiatan_kkn', 'daily_reports');

        Schema::table('peserta_kkn', function (Blueprint $table) {
            $table->renameColumn('kelompok_id', 'group_id');
            $table->renameColumn('mahasiswa_id', 'student_id');
        });
        Schema::rename('peserta_kkn', 'registrations');

        Schema::table('kelompok_kkn', function (Blueprint $table) {
            $table->renameColumn('dpl_id', 'lecturer_id');
            $table->renameColumn('nama_kelompok', 'name');
        });
        Schema::rename('kelompok_kkn', 'groups');

        Schema::table('mahasiswa', function (Blueprint $table) {
            $table->renameColumn('nama', 'name');
        });
        Schema::rename('mahasiswa', 'students');

        Schema::table('dosen', function (Blueprint $table) {
            $table->renameColumn('nama', 'name');
        });
        Schema::rename('dosen', 'lecturers');
    }
};
