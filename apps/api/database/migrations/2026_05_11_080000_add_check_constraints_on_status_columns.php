<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add CHECK constraints on status columns to prevent invalid values at DB level
        DB::statement("ALTER TABLE peserta_kkn DROP CONSTRAINT IF EXISTS peserta_kkn_status_check");
        DB::statement("ALTER TABLE peserta_kkn ADD CONSTRAINT peserta_kkn_status_check CHECK (status IN ('pending','approved','rejected','withdrawn','graduated'))");

        DB::statement("ALTER TABLE kegiatan_kkn DROP CONSTRAINT IF EXISTS kegiatan_kkn_status_check");
        DB::statement("ALTER TABLE kegiatan_kkn ADD CONSTRAINT kegiatan_kkn_status_check CHECK (status IN ('draft','pending','approved','rejected','revision'))");

        DB::statement("ALTER TABLE laporan_akhir DROP CONSTRAINT IF EXISTS laporan_akhir_status_check");
        DB::statement("ALTER TABLE laporan_akhir ADD CONSTRAINT laporan_akhir_status_check CHECK (status IN ('draft','submitted','approved','rejected','revision'))");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE peserta_kkn DROP CONSTRAINT IF EXISTS peserta_kkn_status_check");
        DB::statement("ALTER TABLE kegiatan_kkn DROP CONSTRAINT IF EXISTS kegiatan_kkn_status_check");
        DB::statement("ALTER TABLE laporan_akhir DROP CONSTRAINT IF EXISTS laporan_akhir_status_check");
    }
};
