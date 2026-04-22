<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\KonfigurasiSertifikat;
use App\Models\KKN\LaporanAkhir;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\SertifikatKkn;
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
            'mahasiswa.prodi',
            'mahasiswa.fakultas',
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

        // Cek Laporan Akhir
        $laporanApproved = LaporanAkhir::where('kelompok_id', $kelompok->id)
            ->where('status', 'approved')
            ->exists();

        if (! $laporanApproved) {
            throw new RuntimeException('Laporan akhir belum disetujui untuk kelompok ini');
        }

        // Load Dynamic Configs using optimized Service
        $configService = app(KKN\KonfigurasiSertifikatService::class);
        $periodeId = (int) $periode->id;
        
        $configs = $configService->getAllForPeriode($periodeId);

        $lokasi = $kelompok->lokasi;
        $locationStr = $lokasi ? trim(implode(', ', array_filter([
            $lokasi->village_name ?? null,
            $lokasi->district_name ?? null,
            $lokasi->regency_name ?? null,
        ]))) : '-';
        
        $name = $mahasiswaModel->nama ?? $mahasiswaModel->user?->name ?? '-';
        $periodName = $periode->name ?? '-';
        $fakultasName = $mahasiswaModel->fakultas?->nama ?? '-';
        $prodiName = $mahasiswaModel->prodi?->nama ?? '-';

        // Process Body Text Placeholders (Harmonized with UI + Legacy Support)
        $body = $configs['cert_body'] ?? 'Telah mengikuti Kuliah Kerja Nyata (KKN) periode [Periode] di lokasi [Lokasi].';
        
        // New Standard
        $body = str_replace('[Nama]', $name, $body);
        $body = str_replace('[NIM]', $mahasiswaModel->nim ?? '', $body);
        $body = str_replace('[Fakultas]', $fakultasName, $body);
        $body = str_replace('[Prodi]', $prodiName, $body);
        $body = str_replace('[Kelompok]', $kelompok->nama ?? '-', $body);
        $body = str_replace('[Lokasi]', $locationStr, $body);
        $body = str_replace('[Periode]', $periodName, $body);

        // Legacy Support (Case-insensitive where possible)
        $body = str_replace('[StudentName]', $name, $body);
        $body = str_replace('[LOKASI]', $locationStr, $body);
        $body = str_replace('[PERIODE]', $periodName, $body);

        $verificationToken = self::generateVerificationToken($score);
        $certificateNo = 'KKN/'.($periode->id ?? 0).'/'.$verificationToken;
        $verificationUrl = url("/verify-certificate/{$verificationToken}");

        // Simpan riwayat sertifikat ke database
        SertifikatKkn::updateOrCreate(
            [
                'user_id' => $mahasiswaModel->user_id,
                'periode_id' => $periode->id,
            ],
            [
                'nilai_kkn_id' => $score->id,
                'kelompok_id' => $kelompok->id,
                'certificate_number' => $certificateNo,
                'verification_token' => $verificationToken,
                'nama_mahasiswa' => $name,
                'nim' => $mahasiswaModel->nim ?? '-',
                'nama_prodi' => $prodiName,
                'nama_fakultas' => $fakultasName,
                'lokasi_kkn' => $locationStr,
                'total_score' => $score->total_score,
                'letter_grade' => $score->letter_grade,
                'issued_at' => now(),
                'issued_by' => auth()->id(),
            ]
        );

        $bgPath = $configs['cert_background'] ?? null;
        if ($bgPath && \Illuminate\Support\Facades\Storage::disk('public')->exists($bgPath)) {
            $bgImage = storage_path('app/public/'.$bgPath);
        } else {
            $bgImage = public_path('images/cert-bg-default.png');
        }

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
            'certificate_no' => $certificateNo,
            'signer1_name' => $configs['cert_signer_left_name'] ?? '-',
            'signer1_title' => $configs['cert_signer_left_title'] ?? '-',
            'signer2_name' => $configs['cert_signer_right_name'] ?? '-',
            'signer2_title' => $configs['cert_signer_right_title'] ?? '-',
            'bg_image' => $bgImage,
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

    /**
     * Cari sertifikat berdasarkan token verifikasi (untuk halaman verifikasi publik).
     */
    public function findByToken(string $token): ?SertifikatKkn
    {
        return SertifikatKkn::where('verification_token', $token)->first();
    }

    /**
     * Cabut/batalkan sertifikat.
     */
    public function revoke(SertifikatKkn $sertifikat, string $reason): SertifikatKkn
    {
        $sertifikat->update([
            'revoked_at' => now(),
            'revoke_reason' => $reason,
            'revoked_by' => auth()->id(),
        ]);

        return $sertifikat->fresh();
    }

    /**
     * Statistik sertifikat per periode.
     */
    public function getStats(?int $periodeId = null): array
    {
        $query = SertifikatKkn::query();

        if ($periodeId) {
            $query->forPeriode($periodeId);
        }

        return [
            'total_terbit' => (clone $query)->count(),
            'aktif' => (clone $query)->valid()->count(),
            'dicabut' => (clone $query)->whereNotNull('revoked_at')->count(),
        ];
    }
}
