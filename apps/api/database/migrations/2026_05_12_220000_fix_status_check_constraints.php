<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Fix CHECK constraint values untuk status columns.
 *
 * Migration sebelumnya (2026_05_11_080000_add_check_constraints_on_status_columns.php)
 * mendeklarasikan enum yang TIDAK cocok dengan status aktual yang dipakai kode:
 *   - peserta_kkn: constraint izinkan {pending,approved,rejected,withdrawn,graduated}
 *     tapi kode pakai {pending,document_submitted,document_verified,approved,
 *     rejected,cancelled,completed}. Akibat: upload dokumen / student leave /
 *     finalize score → SQLSTATE 23514 check_violation.
 *   - kegiatan_kkn: constraint izinkan 'pending', tapi kode pakai 'submitted'
 *     sebagai canonical (lihat KegiatanKkn::STATUS_SUBMITTED).
 *   - laporan_akhir: constraint sudah OK untuk kode, tapi kita re-assert
 *     untuk konsistensi.
 *
 * Migration ini:
 *   1. Drop constraint yang lama (jika ada).
 *   2. Terapkan constraint baru yang match kode aktual.
 *
 * Safe untuk di-re-run. Tidak touch data.
 */
return new class extends Migration
{
    public function up(): void
    {
        // peserta_kkn — match status yang benar-benar ditulis di kode.
        DB::statement('ALTER TABLE peserta_kkn DROP CONSTRAINT IF EXISTS peserta_kkn_status_check');
        DB::statement("
            ALTER TABLE peserta_kkn ADD CONSTRAINT peserta_kkn_status_check
            CHECK (status IN (
                'pending',
                'document_submitted',
                'document_verified',
                'approved',
                'rejected',
                'cancelled',
                'completed'
            ))
        ");

        // kegiatan_kkn — canonical enum (lihat KegiatanKkn.php).
        DB::statement('ALTER TABLE kegiatan_kkn DROP CONSTRAINT IF EXISTS kegiatan_kkn_status_check');
        DB::statement("
            ALTER TABLE kegiatan_kkn ADD CONSTRAINT kegiatan_kkn_status_check
            CHECK (status IN (
                'draft',
                'submitted',
                'approved',
                'revision'
            ))
        ");

        // laporan_akhir — canonical enum (lihat LaporanAkhir.php).
        DB::statement('ALTER TABLE laporan_akhir DROP CONSTRAINT IF EXISTS laporan_akhir_status_check');
        DB::statement("
            ALTER TABLE laporan_akhir ADD CONSTRAINT laporan_akhir_status_check
            CHECK (status IN (
                'draft',
                'submitted',
                'approved',
                'revision'
            ))
        ");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE peserta_kkn DROP CONSTRAINT IF EXISTS peserta_kkn_status_check');
        DB::statement('ALTER TABLE kegiatan_kkn DROP CONSTRAINT IF EXISTS kegiatan_kkn_status_check');
        DB::statement('ALTER TABLE laporan_akhir DROP CONSTRAINT IF EXISTS laporan_akhir_status_check');
    }
};
