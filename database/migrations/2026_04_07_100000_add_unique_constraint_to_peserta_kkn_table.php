<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * FIX C14: Add unique constraint to prevent duplicate registrations
     * This prevents race conditions from creating duplicate peserta_kkn records
     * for the same student in the same period.
     */
    public function up(): void
    {
        Schema::table('peserta_kkn', function (Blueprint $table) {
            // Add unique constraint on (mahasiswa_id, period_id)
            $table->unique(['mahasiswa_id', 'period_id'], 'peserta_kkn_mahasiswa_period_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('peserta_kkn', function (Blueprint $table) {
            $table->dropUnique('peserta_kkn_mahasiswa_period_unique');
        });
    }
};
