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

        // Logic Anti-Halu
        $laporanAkhir = \App\Models\KKN\LaporanAkhir::where('mahasiswa_id', $score->mahasiswa_id)
            ->where('kelompok_id', $score->kelompok_id)
            ->first();

        abort_if(!$laporanAkhir || $laporanAkhir->status !== 'approved', 403, 'Sertifikat belum tersedia. Laporan akhir belum disetujui DPL.');
        abort_if($score->total_score < 70, 403, 'Sertifikat hanya diberikan kepada mahasiswa dengan nilai minimal B.');

        // Load Dynamic Configs
        $configs = \App\Models\KKN\KonfigurasiSertifikat::all()->pluck('value', 'config_key');

        $mahasiswaModel = $score->mahasiswa;
        $lokasi = $score->kelompok->lokasi;
        $locationStr = trim(($lokasi->village_name ?? '') . ', ' . ($lokasi->district_name ?? '') . ', ' . ($lokasi->city_name ?? ''));
        $name = $score->mahasiswa->nama ?? $score->mahasiswa->user->name;
        $periodName = $score->kelompok->periode->name;

        // Process Body Text Placeholders
        $body = $configs['cert_body'] ?? '';
        $body = str_replace('[StudentName]', "<strong>{$name}</strong>", $body);
        $body = str_replace('[NIM]', "<strong>{$mahasiswaModel->nim}</strong>", $body);
        $body = str_replace('[LOKASI]', "<strong>{$locationStr}</strong>", $body);
        $body = str_replace('[PERIODE]', "<strong>{$periodName}</strong>", $body);

        $verificationToken = strtoupper(substr(md5("CERT-{$score->id}-{$score->mahasiswa_id}"), 0, 12));
        $verificationUrl = url("/verify-certificate/{$verificationToken}");

        $data = [
            'title' => $configs['cert_title'] ?? 'SERTIFIKAT PENGHARGAAN',
            'body' => $body,
            'name' => $name,
            'nim' => $mahasiswaModel?->nim ?? '-',
            'period' => $periodName,
            'location' => $locationStr,
            'score' => $score->total_score,
            'grade' => $score->letter_grade,
            'date' => now()->translatedFormat('d F Y'),
            'certificate_no' => 'KKN/' . $score->kelompok->periode->id . '/' . $verificationToken,
            'signer_left_name' => $configs['cert_signer_left_name'] ?? '-',
            'signer_left_title' => $configs['cert_signer_left_title'] ?? '-',
            'signer_right_name' => $configs['cert_signer_right_name'] ?? '-',
            'signer_right_title' => $configs['cert_signer_right_title'] ?? '-',
            'background' => $configs['cert_background'] ?? '/images/cert-bg.png',
            'qr_url' => "https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=" . urlencode($verificationUrl) . "&choe=UTF-8",
        ];

        return Pdf::loadView('reports.certificate', $data)
            ->setPaper('a4', 'landscape');
    }
}