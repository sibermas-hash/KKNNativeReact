<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

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
        if (Schema::hasTable('kelompok_kkn') && ! $this->hasNamedIndex('kelompok_kkn', 'one_village_one_group_per_period')) {
            Schema::table('kelompok_kkn', function (Blueprint $table) {
                $table->unique(['location_id', 'periode_id'], 'one_village_one_group_per_period');
            });
        }

        // ──────────────────────────────────────────────
        // A3: Partisi konfigurasi_sertifikat per Periode
        // Pola Inheritance: NULL = global default, filled = override per kamar
        // ──────────────────────────────────────────────
        // Pertama, hapus unique constraint lama yang hanya berdasarkan config_key
        if (Schema::hasTable('konfigurasi_sertifikat') && $this->hasNamedIndex('konfigurasi_sertifikat', 'konfigurasi_sertifikat_config_key_unique')) {
            Schema::table('konfigurasi_sertifikat', function (Blueprint $table) {
                $table->dropUnique('konfigurasi_sertifikat_config_key_unique');
            });
        }

        if (Schema::hasTable('konfigurasi_sertifikat') && ! Schema::hasColumn('konfigurasi_sertifikat', 'periode_id')) {
            Schema::table('konfigurasi_sertifikat', function (Blueprint $table) {
                // Tambah kolom periode_id nullable (NULL = konfigurasi global)
                $table->unsignedBigInteger('periode_id')->nullable()->after('id');

                // Foreign key ke tabel periode
                $table->foreign('periode_id')
                    ->references('id')
                    ->on('periode')
                    ->onDelete('cascade');
            });
        }

        if (Schema::hasTable('konfigurasi_sertifikat') && ! $this->hasNamedIndex('konfigurasi_sertifikat', 'uq_config_key_periode')) {
            Schema::table('konfigurasi_sertifikat', function (Blueprint $table) {
                // Unique baru: satu config_key per periode (NULL dianggap unik tersendiri oleh PostgreSQL)
                $table->unique(['config_key', 'periode_id'], 'uq_config_key_periode');
            });
        }

        // ──────────────────────────────────────────────
        // B3: Kolom is_locked di tabel periode
        // TRUE setelah seluruh sertifikat selesai di-generate, periode menjadi read-only
        // ──────────────────────────────────────────────
        if (Schema::hasTable('periode') && ! Schema::hasColumn('periode', 'is_locked')) {
            Schema::table('periode', function (Blueprint $table) {
                $table->boolean('is_locked')->default(false)->after('current_phase');
                $table->timestamp('locked_at')->nullable()->after('is_locked');
                $table->unsignedBigInteger('locked_by')->nullable()->after('locked_at');
            });
        }
    }

    public function down(): void
    {
        // Rollback: periode columns
        if (Schema::hasTable('periode') && Schema::hasColumn('periode', 'is_locked')) {
            Schema::table('periode', function (Blueprint $table) {
                $table->dropColumn(['is_locked', 'locked_at', 'locked_by']);
            });
        }

        // Rollback: konfigurasi_sertifikat
        if (Schema::hasTable('konfigurasi_sertifikat') && $this->hasNamedIndex('konfigurasi_sertifikat', 'uq_config_key_periode')) {
            Schema::table('konfigurasi_sertifikat', function (Blueprint $table) {
                $table->dropUnique('uq_config_key_periode');
            });
        }

        if (Schema::hasTable('konfigurasi_sertifikat') && Schema::hasColumn('konfigurasi_sertifikat', 'periode_id')) {
            Schema::table('konfigurasi_sertifikat', function (Blueprint $table) {
                $table->dropForeign(['periode_id']);
                $table->dropColumn('periode_id');
            });
        }

        if (Schema::hasTable('konfigurasi_sertifikat') && ! $this->hasNamedIndex('konfigurasi_sertifikat', 'konfigurasi_sertifikat_config_key_unique')) {
            Schema::table('konfigurasi_sertifikat', function (Blueprint $table) {
                $table->unique('config_key', 'konfigurasi_sertifikat_config_key_unique');
            });
        }

        // Rollback: kelompok unique
        if (Schema::hasTable('kelompok_kkn') && $this->hasNamedIndex('kelompok_kkn', 'one_village_one_group_per_period')) {
            Schema::table('kelompok_kkn', function (Blueprint $table) {
                $table->dropUnique('one_village_one_group_per_period');
            });
        }
    }

    private function hasNamedIndex(string $table, string $indexName): bool
    {
        return match (DB::getDriverName()) {
            'pgsql' => ! empty(DB::select(
                'SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND tablename = ? AND indexname = ? LIMIT 1',
                [$table, $indexName]
            )),
            'mysql' => collect(DB::select("SHOW INDEX FROM `{$table}`"))
                ->contains(fn (object $index): bool => $index->Key_name === $indexName),
            'sqlite' => collect(DB::select("PRAGMA index_list('{$table}')"))
                ->contains(fn (object $index): bool => $index->name === $indexName),
            default => false,
        };
    }
};
