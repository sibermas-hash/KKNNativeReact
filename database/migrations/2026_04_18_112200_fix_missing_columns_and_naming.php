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
        // Fix Users table: fakultas_id -> fakultas_id
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (Schema::hasColumn('users', 'fakultas_id') && !Schema::hasColumn('users', 'fakultas_id')) {
                    $table->renameColumn('fakultas_id', 'fakultas_id');
                } elseif (!Schema::hasColumn('users', 'fakultas_id')) {
                    $table->foreignId('fakultas_id')->nullable()->constrained('fakultas')->nullOnDelete();
                }
            });
        }

        // Fix kegiatan_kkn: add output
        if (Schema::hasTable('kegiatan_kkn')) {
            Schema::table('kegiatan_kkn', function (Blueprint $table) {
                if (!Schema::hasColumn('kegiatan_kkn', 'output')) {
                    $table->text('output')->nullable()->after('deskripsi');
                }
            });
        }

        // Fix laporan_akhir: add review_notes
        if (Schema::hasTable('laporan_akhir')) {
            Schema::table('laporan_akhir', function (Blueprint $table) {
                if (!Schema::hasColumn('laporan_akhir', 'review_notes')) {
                    $table->text('review_notes')->nullable();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (Schema::hasColumn('users', 'fakultas_id')) {
                    $table->renameColumn('fakultas_id', 'fakultas_id');
                }
            });
        }

        if (Schema::hasTable('kegiatan_kkn')) {
            Schema::table('kegiatan_kkn', function (Blueprint $table) {
                $table->dropColumn('output');
            });
        }

        if (Schema::hasTable('laporan_akhir')) {
            Schema::table('laporan_akhir', function (Blueprint $table) {
                $table->dropColumn('review_notes');
            });
        }
    }
};
