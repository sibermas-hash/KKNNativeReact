<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\LaporanAkhir;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\SertifikatKkn;
use App\Models\KKN\SystemSetting;
use App\Services\KKN\KonfigurasiSertifikatService;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer as QrWriter;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpWord\TemplateProcessor;
use RuntimeException;

class CertificateService
{
    /**
     * Generate PDF certificate for a specific student score
     */
    public function generateForStudent(NilaiKkn $score)
    {
        $this->guardEligibility($score);

        $data = $this->prepareCertificateData($score);

        return Pdf::loadView('reports.certificate', $data)
            ->setPaper('a4', 'landscape');
    }

    /**
     * Generate Word certificate for a specific student score
     */
    public function generateWordForStudent(NilaiKkn $score)
    {
        $this->guardEligibility($score);
        $data = $this->prepareCertificateData($score);

        // Path to Word template
        $templatePath = storage_path('app/templates/certificate_template.docx');

        if (! file_exists($templatePath)) {
            throw new RuntimeException('Template Word (.docx) tidak ditemukan di storage/app/templates/certificate_template.docx');
        }

        $templateProcessor = new TemplateProcessor($templatePath);

        // Map data to template placeholders
        $templateProcessor->setValue('TITLE', $data['title']);
        $templateProcessor->setValue('NAME', $data['name']);
        $templateProcessor->setValue('NIM', $data['nim']);
        $templateProcessor->setValue('BODY', strip_tags($data['body']));
        $templateProcessor->setValue('GRADE', $data['grade']);
        $templateProcessor->setValue('DATE', $data['date']);
        $templateProcessor->setValue('CERT_NO', $data['certificate_no']);
        $templateProcessor->setValue('SIGNER1_NAME', $data['signer1_name']);
        $templateProcessor->setValue('SIGNER1_TITLE', $data['signer1_title']);
        $templateProcessor->setValue('SIGNER2_NAME', $data['signer2_name']);
        $templateProcessor->setValue('SIGNER2_TITLE', $data['signer2_title']);

        // QR Code handling in Word would require more complex image injection
        // For now, we provide the core text data

        $tempFile = tempnam(sys_get_temp_dir(), 'cert_');
        $templateProcessor->saveAs($tempFile);

        return $tempFile;
    }

    /**
     * Centralized data preparation to ensure consistency between PDF and Word
     */
    protected function prepareCertificateData(NilaiKkn $score): array
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

        // Audit F-14 fix: threshold tidak lagi hardcoded, baca dari
        // SystemSetting (`certificate_min_score`, default 70).
        // Audit R11-FULL-025/027 fix: explicit round ke 2 decimal untuk
        // avoid floating-point edge case 69.9999999 < 70 (student kehilangan
        // sertifikat karena FP precision). total_score di-store decimal:2
        // di DB, tapi cast (float) di PHP bisa munculkan drift kalau
        // upstream computation belum di-round.
        $minScore = (float) SystemSetting::get('certificate_min_score', '70');
        $normalizedScore = round((float) $score->total_score, 2);
        if ($normalizedScore < $minScore) {
            throw new RuntimeException("Sertifikat hanya diterbitkan untuk nilai minimal {$minScore}");
        }

        // Cek Laporan Akhir
        $laporanApproved = LaporanAkhir::where('kelompok_id', $kelompok->id)
            ->workflowApproved()
            ->exists();

        if (! $laporanApproved) {
            throw new RuntimeException('Laporan akhir belum disetujui untuk kelompok ini');
        }

        $configService = app(KonfigurasiSertifikatService::class);
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

        $body = $configs['cert_body'] ?? 'Telah mengikuti Kuliah Kerja Nyata (KKN) periode [Periode] di lokasi [Lokasi].';

        $replacements = [
            '[Nama]' => $name,
            '[NIM]' => $mahasiswaModel->nim ?? '',
            '[Fakultas]' => $fakultasName,
            '[Prodi]' => $prodiName,
            '[Kelompok]' => $kelompok->nama ?? '-',
            '[Lokasi]' => $locationStr,
            '[Periode]' => $periodName,
            '[StudentName]' => $name,
            '[LOKASI]' => $locationStr,
            '[PERIODE]' => $periodName,
        ];

        $body = str_replace(array_keys($replacements), array_values($replacements), $body);

        $verificationToken = self::generateVerificationToken($score);
        $certificateNo = 'KKN/'.($periode->id ?? 0).'/'.$verificationToken;
        $verificationUrl = url("/verify-certificate/{$verificationToken}");

        // Save history
        SertifikatKkn::updateOrCreate(
            ['user_id' => $mahasiswaModel->user_id, 'periode_id' => $periode->id],
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
        if ($bgPath && Storage::disk('public')->exists($bgPath)) {
            $bgFile = storage_path('app/public/'.$bgPath);
        } else {
            $bgFile = public_path('images/cert-bg-default.png');
        }

        // Convert background to base64 for reliable PDF rendering
        $bgBase64 = '';
        if (file_exists($bgFile)) {
            $bgData = file_get_contents($bgFile);
            $bgType = pathinfo($bgFile, PATHINFO_EXTENSION);
            $bgBase64 = 'data:image/'.$bgType.';base64,'.base64_encode($bgData);
        }

        // Audit R11-FULL-029 fix: sebelumnya pakai chart.googleapis.com yang
        // sudah di-deprecate Google sejak 2012. Sekarang generate QR lokal
        // pakai bacon/bacon-qr-code (SVG) + encode ke data URI.
        // DomPDF 3+ render SVG via data URI dengan baik.
        try {
            $renderer = new ImageRenderer(new RendererStyle(150), new SvgImageBackEnd);
            $qrSvg = (new QrWriter($renderer))->writeString($verificationUrl);
            $qrBase64 = 'data:image/svg+xml;base64,'.base64_encode($qrSvg);
        } catch (\Throwable $e) {
            // Fallback: external QR code provider (free, no deprecation).
            // Note: external fetch may fail at PDF-render time; we still need
            // a non-blocking fallback to avoid empty QR.
            $qrBase64 = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data='.urlencode($verificationUrl);
        }

        return [
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
            'bg_image' => $bgBase64,
            'qr_url' => $qrBase64,
        ];
    }

    /**
     * Generate PDF from an already-issued certificate record.
     * Used by admin/student download paths where source-of-truth is sertifikat_kkn.
     */
    public function generateForIssuedCertificate(SertifikatKkn $certificate)
    {
        $certificate->loadMissing(['periode', 'kelompok.lokasi', 'user']);
        if ($certificate->isRevoked()) {
            throw new RuntimeException('Sertifikat telah dibatalkan.');
        }

        $periode = $certificate->periode;
        if (! $periode) {
            throw new RuntimeException('Data periode sertifikat tidak ditemukan');
        }

        $configService = app(KonfigurasiSertifikatService::class);
        $configs = $configService->getAllForPeriode((int) $periode->id);
        $body = $configs['cert_body'] ?? 'Telah mengikuti Kuliah Kerja Nyata (KKN) periode [Periode] di lokasi [Lokasi].';
        $body = str_replace(
            ['[Nama]', '[NIM]', '[Fakultas]', '[Prodi]', '[Kelompok]', '[Lokasi]', '[Periode]', '[StudentName]', '[LOKASI]', '[PERIODE]'],
            [
                $certificate->nama_mahasiswa ?? '-',
                $certificate->nim ?? '-',
                $certificate->nama_fakultas ?? '-',
                $certificate->nama_prodi ?? '-',
                $certificate->kelompok?->nama ?? '-',
                $certificate->lokasi_kkn ?? '-',
                $periode->name ?? '-',
                $certificate->nama_mahasiswa ?? '-',
                $certificate->lokasi_kkn ?? '-',
                $periode->name ?? '-',
            ],
            $body
        );

        $bgFile = public_path('images/cert-bg-default.png');
        $bgPath = $configs['cert_background'] ?? null;
        if ($bgPath && Storage::disk('public')->exists($bgPath)) {
            $bgFile = storage_path('app/public/'.$bgPath);
        }
        $bgBase64 = $this->imageDataUri($bgFile);

        $layout = $this->decodeCertificateLayout($configs['cert_layout_json'] ?? null);
        $photoBase64 = '';
        $avatarPath = $certificate->user?->avatar;
        if (is_string($avatarPath) && $avatarPath !== '') {
            $photoBase64 = $this->publicStorageImageDataUri($avatarPath);
        }
        $signerLeftSignature = $this->publicStorageImageDataUri($configs['cert_signer_left_signature'] ?? null);
        $signerRightSignature = $this->publicStorageImageDataUri($configs['cert_signer_right_signature'] ?? null);
        $stampImage = $this->publicStorageImageDataUri($configs['cert_stamp'] ?? null);

        $verificationToken = $certificate->verification_token ?: self::generateIssuedCertificateToken($certificate);
        $verificationUrl = url("/verify-certificate/{$verificationToken}");
        try {
            $renderer = new ImageRenderer(new RendererStyle(150), new SvgImageBackEnd);
            $qrBase64 = 'data:image/svg+xml;base64,'.base64_encode((new QrWriter($renderer))->writeString($verificationUrl));
        } catch (\Throwable) {
            $qrBase64 = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data='.urlencode($verificationUrl);
        }

        return Pdf::loadView('reports.certificate', [
            'title' => $configs['cert_title'] ?? 'SERTIFIKAT PENGHARGAAN',
            'body' => $body,
            'name' => $certificate->nama_mahasiswa ?? '-',
            'nim' => $certificate->nim ?? '-',
            'period' => $periode->name ?? '-',
            'location' => $certificate->lokasi_kkn ?? '-',
            'score' => $certificate->total_score,
            'grade' => $certificate->letter_grade,
            'date' => ($certificate->issued_at ?: now())->translatedFormat('d F Y'),
            'certificate_no' => $certificate->certificate_number ?: 'KKN/'.$periode->id.'/'.$verificationToken,
            'signer1_name' => $configs['cert_signer_left_name'] ?? '-',
            'signer1_title' => $configs['cert_signer_left_title'] ?? '-',
            'signer2_name' => $configs['cert_signer_right_name'] ?? '-',
            'signer2_title' => $configs['cert_signer_right_title'] ?? '-',
            'bg_image' => $bgBase64,
            'qr_url' => $qrBase64,
            'layout' => $layout,
            'photo_image' => $photoBase64,
            'signer_left_signature' => $signerLeftSignature,
            'signer_right_signature' => $signerRightSignature,
            'stamp_image' => $stampImage,
        ])->setPaper('a4', 'landscape');
    }

    /**
     * Generate a fast preview (base64) for the admin dashboard
     */
    public function preview(NilaiKkn $score): string
    {
        $pdf = $this->generateForStudent($score);

        return base64_encode($pdf->output());
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
                $fileName = preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $fileName);
                $zip->addFromString($fileName, $pdf->output());
            } catch (\Exception $e) {
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

    public static function generateIssuedCertificateToken(SertifikatKkn $certificate): string
    {
        $secret = config('app.key');
        $source = $certificate->nilai_kkn_id ?: $certificate->id;
        $payload = "CERT-{$source}-{$certificate->user_id}";

        return strtoupper(substr(hash_hmac('sha256', $payload, $secret), 0, 16));
    }

    private function imageDataUri(?string $absolutePath): string
    {
        if (! $absolutePath || ! file_exists($absolutePath)) {
            return '';
        }

        return 'data:image/'.pathinfo($absolutePath, PATHINFO_EXTENSION).';base64,'.base64_encode((string) file_get_contents($absolutePath));
    }

    private function publicStorageImageDataUri(mixed $path): string
    {
        if (! is_string($path) || $path === '') {
            return '';
        }
        $normalized = ltrim(str_replace('storage/', '', $path), '/');
        if (! Storage::disk('public')->exists($normalized)) {
            return '';
        }

        return $this->imageDataUri(storage_path('app/public/'.$normalized));
    }

    private function decodeCertificateLayout(?string $json): array
    {
        $defaults = [
            'photo' => ['visible' => false, 'x' => 77, 'y' => 23, 'width' => 11, 'height' => 14],
            'signer_left_signature' => ['visible' => true, 'width' => 16, 'height' => 8],
            'signer_right_signature' => ['visible' => true, 'width' => 16, 'height' => 8],
            'stamp' => ['visible' => true, 'width' => 11, 'height' => 11],
        ];
        if (! $json) {
            return $defaults;
        }
        $decoded = json_decode($json, true);
        if (! is_array($decoded)) {
            return $defaults;
        }

        return array_replace_recursive($defaults, $decoded);
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
     * C-01 fix: Guard certificate generation — gugur/cancelled students must not receive certificates.
     */
    private function guardEligibility(NilaiKkn $score): void
    {
        if (! $score->is_finalized) {
            throw new RuntimeException('Nilai belum difinalisasi. Sertifikat tidak dapat digenerate.');
        }

        $score->loadMissing('mahasiswa');
        $mahasiswa = $score->mahasiswa;
        $mahasiswaId = $mahasiswa?->getKey();

        if ($mahasiswaId && $score->kelompok_id) {
            $peserta = PesertaKkn::where('mahasiswa_id', $mahasiswaId)
                ->where('kelompok_id', $score->kelompok_id)
                ->first();

            if ($peserta && in_array($peserta->status, ['gugur', 'cancelled', 'rejected', 'transferred'])) {
                throw new RuntimeException("Mahasiswa dengan status '{$peserta->status}' tidak berhak menerima sertifikat.");
            }
        }
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
