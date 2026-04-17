<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\KonfigurasiSertifikat;
use App\Models\KKN\NilaiKkn;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Collection;
use RuntimeException;

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
            'kelompok.dosen.user',
        ]);

        $mahasiswaModel = $score->mahasiswa;

        if (! $mahasiswaModel) {
            throw new RuntimeException('Data mahasiswa untuk nilai ini tidak ditemukan');
        }

        $kelompok = $score->kelompok;
        if (! $kelompok) {
            throw new RuntimeException('Data kelompok untuk nilai ini tidak ditemukan');
        }

        $periode = $kelompok->periode;
        if (! $periode) {
            throw new RuntimeException('Data periode untuk kelompok ini tidak ditemukan');
        }

        if ($score->total_score < 70) {
            throw new RuntimeException('Sertifikat hanya diterbitkan untuk nilai minimal B (70)');
        }

        $laporanApproved = \App\Models\KKN\LaporanAkhir::where('kelompok_id', $kelompok->id)
            ->where('status', 'approved')
            ->exists();

        if (! $laporanApproved) {
            throw new RuntimeException('Laporan akhir belum disetujui untuk kelompok ini');
        }

        // Load Dynamic Configs
        $configs = KonfigurasiSertifikat::all()->pluck('value', 'config_key');

        $lokasi = $kelompok->lokasi;
        $locationStr = $lokasi ? trim(implode(', ', array_filter([
            $lokasi->village_name ?? null,
            $lokasi->district_name ?? null,
            $lokasi->regency_name ?? null,
        ]))) : '-';
        $name = $mahasiswaModel->nama ?? $mahasiswaModel->user?->name ?? '-';
        $periodName = $periode->name ?? '-';

        // Process Body Text Placeholders
        $body = $configs['cert_body'] ?? '';
        $body = str_replace('[StudentName]', "<strong>{$name}</strong>", $body);
        $body = str_replace('[NIM]', "<strong>{$mahasiswaModel->nim}</strong>", $body);
        $body = str_replace('[LOKASI]', "<strong>{$locationStr}</strong>", $body);
        $body = str_replace('[PERIODE]', "<strong>{$periodName}</strong>", $body);

        $verificationToken = self::generateVerificationToken($score);
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
            'certificate_no' => 'KKN/'.($periode->id ?? 0).'/'.$verificationToken,
            'signer1_name' => $configs['cert_signer_left_name'] ?? '-',
            'signer1_title' => $configs['cert_signer_left_title'] ?? '-',
            'signer2_name' => $configs['cert_signer_right_name'] ?? '-',
            'signer2_title' => $configs['cert_signer_right_title'] ?? '-',
            'bg_image' => $configs['cert_background'] ?? public_path('images/cert-bg-default.png'),
            'qr_url' => 'https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl='.urlencode($verificationUrl).'&choe=UTF-8',
        ];

        return Pdf::loadView('reports.certificate', $data)
            ->setPaper('a4', 'landscape');
    }

    /**
     * Generate a ZIP of certificates for a collection of scores
     */
    public function generateZip(Collection $scores)
    {
        $zip = new \ZipArchive;
        $zipFileName = 'Sertifikat_KKN_Massal_'.now()->format('Ymd_His').'.zip';
        $zipFilePath = storage_path('app/public/'.$zipFileName);

        if ($zip->open($zipFilePath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            throw new RuntimeException('Gagal membuat file ZIP.');
        }

        foreach ($scores as $score) {
            try {
                $pdf = $this->generateForStudent($score);
                $fileName = "Sertifikat_{$score->mahasiswa->nim}_{$score->mahasiswa->nama}.pdf";
                // Sanitize filename
                $fileName = preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $fileName);
                $zip->addFromString($fileName, $pdf->output());
            } catch (\Exception $e) {
                // Skip failed ones but log them if needed
                continue;
            }
        }

        $zip->close();

        return response()->download($zipFilePath)->deleteFileAfterSend(true);
    }

    /**
     * Generate a cryptographically strong verification token for a score.
     * Uses HMAC-SHA256 with APP_KEY as secret, making tokens unguessable.
     */
    public static function generateVerificationToken(NilaiKkn $score): string
    {
        $secret = config('app.key');
        // Use user_id (renamed from mahasiswa_id) which stores users.id
        $payload = "CERT-{$score->id}-{$score->user_id}";

        return strtoupper(substr(hash_hmac('sha256', $payload, $secret), 0, 16));
    }
}
