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
        Schema::table('nilai_kkn', function (Blueprint $table) {
            // Aspek Penilaian Pemerintah Desa (Hal 41)
            $table->decimal('desa_interaksi_score', 5, 2)->nullable()->comment('Interaksi Sosial & Kontribusi (30%)');
            $table->decimal('desa_disiplin_score', 5, 2)->nullable()->comment('Kedisiplinan & Etika (40%)');
            $table->decimal('desa_kinerja_score', 5, 2)->nullable()->comment('Kinerja Kelompok (30%)');

            // Aspek Penilaian DPL (Hal 42)
            $table->decimal('dpl_relevansi_score', 5, 2)->nullable()->comment('Relevansi Program & Kebutuhan (20%)');
            $table->decimal('dpl_ketercapaian_score', 5, 2)->nullable()->comment('Tingkat Ketercapaian & Dampak (20%)');
            $table->decimal('dpl_inovasi_score', 5, 2)->nullable()->comment('Inovasi & Kreativitas (20%)');
            $table->decimal('dpl_administrasi_score', 5, 2)->nullable()->comment('Administrasi & Pelaporan (20%)');
            $table->decimal('dpl_artikel_score', 5, 2)->nullable()->comment('Artikel Pengabdian (20%)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('nilai_kkn', function (Blueprint $table) {
            $table->dropColumn([
                'desa_interaksi_score',
                'desa_disiplin_score',
                'desa_kinerja_score',
                'dpl_relevansi_score',
                'dpl_ketercapaian_score',
                'dpl_inovasi_score',
                'dpl_administrasi_score',
                'dpl_artikel_score',
            ]);
        });
    }
};
