<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Sprint 1 — Fondasi Database: Isolasi Kamar per Periode
 *
 * Migrasi ini menerapkan 3 pilar keamanan database:
 * A1: 1 Desa = 1 Kelompok per Periode (unique constraint)
 * A3: Partisi konfigurasi_sertifikat per Periode (inheritance pattern)
 * B3: Kolom is_locked di periode (read-only lock setelah sertifikasi)
 *
 * Catatan: A2 (unique mahasiswa_id + periode_id di peserta_kkn) sudah ada
 * sebagai index 'unique_mahasiswa_periode'.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ──────────────────────────────────────────────
        // A1: 1 Desa = 1 Kelompok per Periode
        // Mencegah duplikasi kelompok pada desa yang sama dalam satu periode.
        // Hanya berlaku untuk kelompok yang belum di-soft-delete dan punya lokasi.
        // ──────────────────────────────────────────────
        Schema::table('kelompok_kkn', function (Blueprint $table) {
            // Check if constraint already exists before adding
            $exists = DB::select("SELECT 1 FROM pg_constraint WHERE conname = 'one_village_one_group_per_period'");
            if (empty($exists)) {
                $table->unique(['location_id', 'periode_id'], 'one_village_one_group_per_period');
            }
        });

        // ──────────────────────────────────────────────
        // A3: Partisi konfigurasi_sertifikat per Periode
        // Pola Inheritance: NULL = global default, filled = override per kamar
        // ──────────────────────────────────────────────
        // Pertama, hapus unique constraint lama yang hanya berdasarkan config_key
        Schema::table('konfigurasi_sertifikat', function (Blueprint $table) {
            $table->dropUnique('konfigurasi_sertifikat_config_key_unique');
        });

        Schema::table('konfigurasi_sertifikat', function (Blueprint $table) {
            // Tambah kolom periode_id nullable (NULL = konfigurasi global)
            $table->unsignedBigInteger('periode_id')->nullable()->after('id');

            // Foreign key ke tabel periode
            $table->foreign('periode_id')
                ->references('id')
                ->on('periode')
                ->onDelete('cascade');

            // Unique baru: satu config_key per periode (NULL dianggap unik tersendiri oleh PostgreSQL)
            $table->unique(['config_key', 'periode_id'], 'uq_config_key_periode');
        });

        // ──────────────────────────────────────────────
        // B3: Kolom is_locked di tabel periode
        // TRUE setelah seluruh sertifikat selesai di-generate, periode menjadi read-only
        // ──────────────────────────────────────────────
        Schema::table('periode', function (Blueprint $table) {
            $table->boolean('is_locked')->default(false)->after('current_phase');
            $table->timestamp('locked_at')->nullable()->after('is_locked');
            $table->unsignedBigInteger('locked_by')->nullable()->after('locked_at');
        });
    }

    public function down(): void
    {
        // Rollback: periode columns
        Schema::table('periode', function (Blueprint $table) {
            $table->dropColumn(['is_locked', 'locked_at', 'locked_by']);
        });

        // Rollback: konfigurasi_sertifikat
        Schema::table('konfigurasi_sertifikat', function (Blueprint $table) {
            $table->dropUnique('uq_config_key_periode');
            $table->dropForeign(['periode_id']);
            $table->dropColumn('periode_id');
        });

        Schema::table('konfigurasi_sertifikat', function (Blueprint $table) {
            $table->unique('config_key', 'konfigurasi_sertifikat_config_key_unique');
        });

        // Rollback: kelompok unique
        Schema::table('kelompok_kkn', function (Blueprint $table) {
            $table->dropUnique('one_village_one_group_per_period');
        });
    }
};
