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
        // Fix kelompok_kkn: periode_id -> periode_id
        if (Schema::hasTable('kelompok_kkn')) {
            Schema::table('kelompok_kkn', function (Blueprint $table) {
                if (Schema::hasColumn('kelompok_kkn', 'periode_id') && ! Schema::hasColumn('kelompok_kkn', 'periode_id')) {
                    $table->renameColumn('periode_id', 'periode_id');
                }
            });
        }

        // Fix prodi: fakultas_id -> fakultas_id (sudah ada di laporan sdh diperbaiki, tapi mari kita pastikan)
        if (Schema::hasTable('prodi')) {
            Schema::table('prodi', function (Blueprint $table) {
                if (Schema::hasColumn('prodi', 'fakultas_id') && ! Schema::hasColumn('prodi', 'fakultas_id')) {
                    $table->renameColumn('fakultas_id', 'fakultas_id');
                }
            });
        }

        // Fix lokasi: fakultas_id -> fakultas_id
        if (Schema::hasTable('lokasi')) {
            Schema::table('lokasi', function (Blueprint $table) {
                if (Schema::hasColumn('lokasi', 'fakultas_id') && ! Schema::hasColumn('lokasi', 'fakultas_id')) {
                    $table->renameColumn('fakultas_id', 'fakultas_id');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('kelompok_kkn')) {
            Schema::table('kelompok_kkn', function (Blueprint $table) {
                if (Schema::hasColumn('kelompok_kkn', 'periode_id')) {
                    $table->renameColumn('periode_id', 'periode_id');
                }
            });
        }

        if (Schema::hasTable('prodi')) {
            Schema::table('prodi', function (Blueprint $table) {
                if (Schema::hasColumn('prodi', 'fakultas_id')) {
                    $table->renameColumn('fakultas_id', 'fakultas_id');
                }
            });
        }

        if (Schema::hasTable('lokasi')) {
            Schema::table('lokasi', function (Blueprint $table) {
                if (Schema::hasColumn('lokasi', 'fakultas_id')) {
                    $table->renameColumn('fakultas_id', 'fakultas_id');
                }
            });
        }
    }
};
