<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use Barryvdh\DomPDF\Facade\Pdf;

/**
 * LogbookPdfService — generate Logbook Harian KKN resmi UIN SAIZU.
 *
 * Output: PDF berisi seluruh laporan harian seorang mahasiswa selama satu periode KKN.
 * Dipakai mahasiswa (submit logbook akhir ke DPL), DPL (arsip), admin (audit).
 *
 * Structure:
 *  1. Cover page: logo/judul UIN SAIZU LPPM, identitas mahasiswa, periode, kelompok, lokasi, DPL
 *  2. Daftar kegiatan harian (table): tanggal, judul, activity, status, reviewer
 *  3. Halaman tanda tangan: DPL signature placeholder, stempel
 *
 * Hanya kegiatan `approved` yang masuk (standar dokumen resmi).
 *
 * Endpoints:
 *   GET /v1/student/logbook/pdf                      (mahasiswa download sendiri)
 *   GET /v1/dpl/logbook/{mahasiswa_id}/pdf           (DPL untuk kelompoknya)
 *   GET /v1/admin/mahasiswa/{mahasiswa_id}/logbook   (admin audit)
 */
class LogbookPdfService
{
    /**
     * Generate PDF logbook untuk satu mahasiswa dalam satu periode.
     */
    public function generate(Mahasiswa $mahasiswa, Periode $periode, bool $approvedOnly = true): \Barryvdh\DomPDF\PDF
    {
        // Ambil peserta record untuk periode ini
        $peserta = $mahasiswa->peserta()->where('periode_id', $periode->id)->with('kelompok.lokasi', 'kelompok.dosen.user')->first();

        $query = KegiatanKkn::query()
            ->where('mahasiswa_id', $mahasiswa->id)
            ->when(
                $peserta?->kelompok_id,
                fn ($q) => $q->where('kelompok_id', $peserta->kelompok_id)
            )
            ->orderBy('date');

        if ($approvedOnly) {
            $query->workflowApproved();
        }

        $kegiatan = $query->with('reviewer', 'fileKegiatan')->get();

        $data = [
            'mahasiswa' => $mahasiswa->load('user', 'fakultas', 'prodi'),
            'periode' => $periode->load('tahunAkademik'),
            'peserta' => $peserta,
            'kelompok' => $peserta?->kelompok,
            'kegiatan' => $kegiatan,
            'dpl' => $peserta?->kelompok?->ketuaDpl?->user,
            'generated_at' => now(),
            'approved_only' => $approvedOnly,
        ];

        return Pdf::loadView('pdf.logbook-terintegrasi', $data)
            ->setPaper('A4', 'portrait')
            ->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => false,
                'defaultFont' => 'DejaVu Sans',
            ]);
    }
}
