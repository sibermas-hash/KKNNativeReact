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
        Schema::table('peserta_kkn', function (Blueprint $table) {
            // Optimized index for auto-plotting and unassigned student filtering
            $table->index(['periode_id', 'status', 'kelompok_id'], 'peserta_kkn_plotting_idx');
        });

        Schema::table('mahasiswa', function (Blueprint $table) {
            // Index for financial requirement filtering
            $table->index(['is_paid_ukt'], 'mahasiswa_ukt_status_idx');
        });
        
        Schema::table('peserta_workshop', function (Blueprint $table) {
            // Index for certificate lookup and passing status checks
            $table->index(['workshop_id', 'is_passed'], 'peserta_workshop_passed_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('peserta_kkn', function (Blueprint $table) {
            $table->dropIndex('peserta_kkn_plotting_idx');
        });

        Schema::table('mahasiswa', function (Blueprint $table) {
            $table->dropIndex('mahasiswa_ukt_status_idx');
        });

        Schema::table('peserta_workshop', function (Blueprint $table) {
            $table->dropIndex('peserta_workshop_passed_idx');
        });
    }
};
