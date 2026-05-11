<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Audit R11-JENIS-005 fix: tambahkan field marital_status untuk enforce
 * requirement beberapa jenis KKN (Nusantara, Internasional, Tematik khusus)
 * yang mewajibkan peserta belum menikah.
 *
 * Default: 'belum_menikah' — asumsi mayoritas mahasiswa S1 belum menikah.
 * Student update sendiri via profil kalau already married; admin juga bisa
 * override via panel admin.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('mahasiswa') || Schema::hasColumn('mahasiswa', 'marital_status')) {
            return;
        }

        Schema::table('mahasiswa', function (Blueprint $table) {
            $table->string('marital_status', 20)
                ->default('belum_menikah')
                ->nullable()
                ->after('shirt_size')
                ->comment('belum_menikah | menikah | pernah_menikah');
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('mahasiswa') && Schema::hasColumn('mahasiswa', 'marital_status')) {
            Schema::table('mahasiswa', function (Blueprint $table) {
                $table->dropColumn('marital_status');
            });
        }
    }
};
