<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * This migration was cleaned up - original version tried to add email_api
 * and prodi_id columns that are no longer needed.
 * Email is stored in users.email, prodi_id is on mahasiswa table.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Ensure mother_name column exists on mahasiswa (needed for API sync)
        if (Schema::hasTable('mahasiswa') && ! Schema::hasColumn('mahasiswa', 'mother_name')) {
            Schema::table('mahasiswa', function (Blueprint $table) {
                $table->string('mother_name', 100)->nullable()->after('nama');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('mahasiswa', 'mother_name')) {
            Schema::table('mahasiswa', function (Blueprint $table) {
                $table->dropColumn('mother_name');
            });
        }
    }
};
