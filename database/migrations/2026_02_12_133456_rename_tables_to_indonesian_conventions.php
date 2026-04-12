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
        Schema::connection('kkn')->rename('lecturers', 'dosen');
        Schema::connection('kkn')->table('dosen', function (Blueprint $table) {
            $table->renameColumn('name', 'nama');
        });

        Schema::connection('kkn')->rename('students', 'mahasiswa');
        Schema::connection('kkn')->table('mahasiswa', function (Blueprint $table) {
            $table->renameColumn('name', 'nama');
        });

        // 2. Rename KKN Domain Tables
        Schema::connection('kkn')->rename('groups', 'kelompok_kkn');
        Schema::connection('kkn')->table('kelompok_kkn', function (Blueprint $table) {
            $table->renameColumn('name', 'nama_kelompok');
            $table->renameColumn('lecturer_id', 'dpl_id');
        });

        Schema::connection('kkn')->rename('registrations', 'peserta_kkn');
        Schema::connection('kkn')->table('peserta_kkn', function (Blueprint $table) {
            $table->renameColumn('student_id', 'mahasiswa_id');
            $table->renameColumn('group_id', 'kelompok_id');
        });

        Schema::connection('kkn')->rename('daily_reports', 'kegiatan_kkn');
        Schema::connection('kkn')->table('kegiatan_kkn', function (Blueprint $table) {
            $table->renameColumn('student_id', 'mahasiswa_id');
            $table->renameColumn('group_id', 'kelompok_id');
        });

        // 3. Rename Supporting Tables
        Schema::connection('kkn')->rename('faculties', 'fakultas');
        Schema::connection('kkn')->table('fakultas', function (Blueprint $table) {
            $table->renameColumn('name', 'nama');
        });

        Schema::connection('kkn')->rename('programs', 'prodi');
        Schema::connection('kkn')->table('prodi', function (Blueprint $table) {
            $table->renameColumn('name', 'nama');
        });

        Schema::connection('kkn')->rename('periods', 'periode');
        Schema::connection('kkn')->rename('locations', 'lokasi');
        Schema::connection('kkn')->rename('academic_years', 'tahun_akademik');

        Schema::connection('kkn')->rename('work_programs', 'program_kerja');
        Schema::connection('kkn')->table('program_kerja', function (Blueprint $table) {
            $table->renameColumn('group_id', 'kelompok_id');
        });

        Schema::connection('kkn')->rename('final_reports', 'laporan_akhir');
        Schema::connection('kkn')->table('laporan_akhir', function (Blueprint $table) {
            $table->renameColumn('student_id', 'mahasiswa_id');
            $table->renameColumn('group_id', 'kelompok_id');
        });

        Schema::connection('kkn')->rename('kkn_scores', 'nilai_kkn');
        Schema::connection('kkn')->table('nilai_kkn', function (Blueprint $table) {
            $table->renameColumn('student_id', 'mahasiswa_id');
            $table->renameColumn('group_id', 'kelompok_id');
        });

        Schema::connection('kkn')->rename('daily_report_files', 'file_kegiatan_kkn');
        Schema::connection('kkn')->table('file_kegiatan_kkn', function (Blueprint $table) {
            $table->renameColumn('daily_report_id', 'kegiatan_kkn_id');
        });

        Schema::connection('kkn')->rename('registration_documents', 'dokumen_peserta_kkn');
        Schema::connection('kkn')->table('dokumen_peserta_kkn', function (Blueprint $table) {
            $table->renameColumn('registration_id', 'peserta_kkn_id');
        });

        Schema::connection('kkn')->rename('evaluations', 'evaluasi');
        Schema::connection('kkn')->table('evaluasi', function (Blueprint $table) {
            $table->renameColumn('student_id', 'mahasiswa_id');
            $table->renameColumn('group_id', 'kelompok_id');
        });

        Schema::connection('kkn')->rename('evaluation_items', 'item_evaluasi');
        Schema::connection('kkn')->table('item_evaluasi', function (Blueprint $table) {
            $table->renameColumn('evaluation_id', 'evaluasi_id');
        });

        Schema::connection('kkn')->rename('work_program_proposals', 'proposal_program_kerja');
        Schema::connection('kkn')->rename('workshops', 'workshop');
        Schema::connection('kkn')->rename('workshop_participants', 'peserta_workshop');
        Schema::connection('kkn')->rename('reports', 'laporan');
        Schema::connection('kkn')->table('laporan', function (Blueprint $table) {
            $table->renameColumn('group_id', 'kelompok_id');
        });

        Schema::connection('kkn')->rename('user_profiles', 'profil_user');
        Schema::connection('kkn')->rename('grading_configs', 'konfigurasi_penilaian');
        Schema::connection('kkn')->rename('audit_logs', 'log_audit');

        Schema::connection('kkn')->table('proposal_program_kerja', function (Blueprint $table) {
            $table->renameColumn('work_program_id', 'program_kerja_id');
        });

        Schema::connection('kkn')->rename('proposals', 'proposal');
        Schema::connection('kkn')->table('proposal', function (Blueprint $table) {
            $table->renameColumn('group_id', 'kelompok_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('kkn')->table('proposal', function (Blueprint $table) {
            $table->renameColumn('kelompok_id', 'group_id');
        });
        Schema::connection('kkn')->rename('proposal', 'proposals');

        Schema::connection('kkn')->table('proposal_program_kerja', function (Blueprint $table) {
            $table->renameColumn('program_kerja_id', 'work_program_id');
        });

        Schema::connection('kkn')->rename('log_audit', 'audit_logs');
        Schema::connection('kkn')->rename('konfigurasi_penilaian', 'grading_configs');
        Schema::connection('kkn')->rename('profil_user', 'user_profiles');

        Schema::connection('kkn')->table('laporan', function (Blueprint $table) {
            $table->renameColumn('kelompok_id', 'group_id');
        });
        Schema::connection('kkn')->rename('laporan', 'reports');

        Schema::connection('kkn')->rename('peserta_workshop', 'workshop_participants');
        Schema::connection('kkn')->rename('workshop', 'workshops');
        Schema::connection('kkn')->rename('proposal_program_kerja', 'work_program_proposals');

        Schema::connection('kkn')->table('item_evaluasi', function (Blueprint $table) {
            $table->renameColumn('evaluasi_id', 'evaluation_id');
        });
        Schema::connection('kkn')->rename('item_evaluasi', 'evaluation_items');

        Schema::connection('kkn')->table('evaluasi', function (Blueprint $table) {
            $table->renameColumn('kelompok_id', 'group_id');
            $table->renameColumn('mahasiswa_id', 'student_id');
        });
        Schema::connection('kkn')->rename('evaluasi', 'evaluations');

        Schema::connection('kkn')->table('dokumen_peserta_kkn', function (Blueprint $table) {
            $table->renameColumn('peserta_kkn_id', 'registration_id');
        });
        Schema::connection('kkn')->rename('dokumen_peserta_kkn', 'registration_documents');

        Schema::connection('kkn')->table('file_kegiatan_kkn', function (Blueprint $table) {
            $table->renameColumn('kegiatan_kkn_id', 'daily_report_id');
        });
        Schema::connection('kkn')->rename('file_kegiatan_kkn', 'daily_report_files');

        Schema::connection('kkn')->table('nilai_kkn', function (Blueprint $table) {
            $table->renameColumn('kelompok_id', 'group_id');
            $table->renameColumn('mahasiswa_id', 'student_id');
        });
        Schema::connection('kkn')->rename('nilai_kkn', 'kkn_scores');

        Schema::connection('kkn')->table('laporan_akhir', function (Blueprint $table) {
            $table->renameColumn('kelompok_id', 'group_id');
            $table->renameColumn('mahasiswa_id', 'student_id');
        });
        Schema::connection('kkn')->rename('laporan_akhir', 'final_reports');

        Schema::connection('kkn')->table('program_kerja', function (Blueprint $table) {
            $table->renameColumn('kelompok_id', 'group_id');
        });
        Schema::connection('kkn')->rename('program_kerja', 'work_programs');

        Schema::connection('kkn')->rename('tahun_akademik', 'academic_years');
        Schema::connection('kkn')->rename('lokasi', 'locations');
        Schema::connection('kkn')->rename('periode', 'periods');

        Schema::connection('kkn')->table('prodi', function (Blueprint $table) {
            $table->renameColumn('nama', 'name');
        });
        Schema::connection('kkn')->rename('prodi', 'programs');

        Schema::connection('kkn')->table('fakultas', function (Blueprint $table) {
            $table->renameColumn('nama', 'name');
        });
        Schema::connection('kkn')->rename('fakultas', 'faculties');

        Schema::connection('kkn')->table('kegiatan_kkn', function (Blueprint $table) {
            $table->renameColumn('kelompok_id', 'group_id');
            $table->renameColumn('mahasiswa_id', 'student_id');
        });
        Schema::connection('kkn')->rename('kegiatan_kkn', 'daily_reports');

        Schema::connection('kkn')->table('peserta_kkn', function (Blueprint $table) {
            $table->renameColumn('kelompok_id', 'group_id');
            $table->renameColumn('mahasiswa_id', 'student_id');
        });
        Schema::connection('kkn')->rename('peserta_kkn', 'registrations');

        Schema::connection('kkn')->table('kelompok_kkn', function (Blueprint $table) {
            $table->renameColumn('dpl_id', 'lecturer_id');
            $table->renameColumn('nama_kelompok', 'name');
        });
        Schema::connection('kkn')->rename('kelompok_kkn', 'groups');

        Schema::connection('kkn')->table('mahasiswa', function (Blueprint $table) {
            $table->renameColumn('nama', 'name');
        });
        Schema::connection('kkn')->rename('mahasiswa', 'students');

        Schema::connection('kkn')->table('dosen', function (Blueprint $table) {
            $table->renameColumn('nama', 'name');
        });
        Schema::connection('kkn')->rename('dosen', 'lecturers');
    }
};
