<?php

namespace App\Services;

use App\Models\KKN\NilaiKkn;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;

class CertificateService
{
    /**
     * Generate PDF certificate for a specific student score
     */
    public function generateForStudent(NilaiKkn $score, array $signers = [])
    {
        $score->loadMissing([
            'mahasiswa.user',
            'kelompok.periode',
            'kelompok.lokasi',
            'kelompok.dpl.user',
        ]);

        // Logic Anti-Halu: Cek progres dokumen wajib (Laporan Akhir)
        $laporanAkhir = \App\Models\KKN\LaporanAkhir::where('mahasiswa_id', $score->mahasiswa_id)
            ->where('kelompok_id', $score->kelompok_id)
            ->first();

        abort_if(!$laporanAkhir || $laporanAkhir->status !== 'approved', 403, 'Sertifikat belum tersedia. Laporan akhir belum disetujui DPL.');

        // Logic Minimal Grade 'B' (>= 70)
        abort_if($score->total_score < 70, 403, 'Sertifikat hanya diberikan kepada mahasiswa dengan nilai minimal B.');

        $mahasiswaModel = $score->mahasiswa;
        $lokasi = $score->kelompok->lokasi;

        $verificationToken = strtoupper(substr(md5("CERT-{$score->id}-{$score->mahasiswa_id}"), 0, 12));
        $verificationUrl = url("/verify-certificate/{$verificationToken}");

        $data = array_merge([
            'name' => $score->mahasiswa->nama ?? $score->mahasiswa->user->name,
            'nim' => $mahasiswaModel?->nim ?? '-',
            'period' => $score->kelompok->periode->name,
            'location' => trim(($lokasi->village_name ?? '') . ', ' . ($lokasi->address ?? '')),
            'score' => $score->total_score,
            'grade' => $score->letter_grade,
            'date' => now()->format('d F Y'),
            'certificate_no' => 'KKN/' . $score->kelompok->periode->id . '/' . $verificationToken,
            'qr_url' => "https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=" . urlencode($verificationUrl) . "&choe=UTF-8",
        ], $signers);

        return Pdf::loadView('reports.certificate', $data)
            ->setPaper('a4', 'landscape');
    }
}
