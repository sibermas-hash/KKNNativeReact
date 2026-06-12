<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\NilaiKknResource;
use App\Http\Resources\Api\V1\SertifikatKknResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\SertifikatKkn;
use App\Services\CertificateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class CertificateController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $user = auth()->user();

        $scores = NilaiKkn::where('user_id', $user->id)
            ->where('is_finalized', true)
            ->with(['kelompok'])
            ->get();

        $certificates = SertifikatKkn::where('user_id', $user->id)
            ->valid()
            ->with(['periode'])
            ->get();

        return $this->success([
            'scores' => NilaiKknResource::collection($scores),
            'certificates' => SertifikatKknResource::collection($certificates),
        ]);
    }

    /**
     * Stream the certificate PDF directly to the client (binary response).
     *
     * FIX (audit R11-API-003 / R9-007 / F-04): previous implementation
     * returned a JSON envelope with `download_url` pointing at the PRIVATE
     * disk via Storage::url(). The frontend treated the response as a binary
     * blob, so users ended up downloading a PDF file whose content was JSON
     * text. Now the controller regenerates the certificate PDF on demand
     * (same pattern as admin RekapNilaiController::downloadCertificate) and
     * streams it with the correct MIME + filename.
     *
     * HARDENING (follow-up): CertificateService::generateForStudent() can
     * throw RuntimeException (laporan akhir belum approved, nilai belum
     * mencukupi, template missing, dll.). Kalau exception lolos ke global
     * exception handler, Laravel akan return JSON 500 — dan dengan
     * responseType:'blob' di FE, JSON itu ikut di-save sebagai `.pdf` file
     * (bug asli muncul lagi). Di sini kita eksplisit catch semua exception
     * dan return JsonResponse bercontent-type application/json sehingga FE
     * blob-type check bisa surface error dengan benar ke user.
     */
    public function download(SertifikatKkn $sertifikat): Response|JsonResponse
    {
        $user = auth()->user();

        // Student: can only download their own certificate
        if ($user->hasRole('student')) {
            if ($sertifikat->user_id !== $user->id) {
                return $this->error('FORBIDDEN', 'Anda tidak memiliki akses ke sertifikat ini.', 403);
            }
        } elseif ($user->hasRole('dpl')) {
            // DPL: only certificates of students in their supervised groups
            $dosen = $user->dosen;
            if (! $dosen) {
                return $this->error('FORBIDDEN', 'Data dosen tidak ditemukan.', 403);
            }
            $groupIds = $dosen->kelompokKkn()->pluck('kelompok_kkn.id');

            // Kelompok_id terkait sertifikat: prefer FK langsung di sertifikat,
            // fallback via NilaiKkn.nilai_kkn_id → kelompok_id. Klom
            // `NilaiKkn.sertifikat_kkn_id` TIDAK ADA di skema; query lama
            // memakai kolom non-existent sehingga selalu 403 (bug).
            $certKelompokId = $sertifikat->kelompok_id;
            if (! $certKelompokId && $sertifikat->nilai_kkn_id) {
                $certKelompokId = NilaiKkn::where('id', $sertifikat->nilai_kkn_id)->value('kelompok_id');
            }

            if (! $certKelompokId || ! $groupIds->contains($certKelompokId)) {
                return $this->error('FORBIDDEN', 'Anda tidak memiliki akses ke sertifikat ini.', 403);
            }
        }

        if ($sertifikat->isRevoked()) {
            return $this->error('FORBIDDEN', 'Sertifikat telah dibatalkan.', 403);
        }

        // Resolve the NilaiKkn source for the certificate. Prefer explicit FK
        // (nilai_kkn_id on the sertifikat row), fall back to user + periode
        // lookup for legacy rows.
        $score = null;
        if ($sertifikat->nilai_kkn_id) {
            $score = NilaiKkn::find($sertifikat->nilai_kkn_id);
        }
        if (! $score) {
            $score = NilaiKkn::where('user_id', $sertifikat->user_id)
                ->whereHas('kelompok', fn ($q) => $q->where('periode_id', $sertifikat->periode_id))
                ->where('is_finalized', true)
                ->latest('id')
                ->first();
        }

        if (! $score) {
            return $this->error('NOT_FOUND', 'Data nilai sumber sertifikat tidak ditemukan.', 404);
        }
        if (! $score->is_finalized) {
            return $this->error('VALIDATION_ERROR', 'Nilai belum difinalisasi. Sertifikat belum dapat diterbitkan.', 422);
        }

        try {
            $pdf = app(CertificateService::class)->generateForStudent($score);
            $safeName = preg_replace(
                '/[^A-Za-z0-9_\-\.]/',
                '_',
                'Sertifikat_KKN_'.($sertifikat->nim ?: (string) $user->id).'.pdf'
            );

            return $pdf->download($safeName);
        } catch (\RuntimeException $e) {
            // Expected business-rule failures from CertificateService:
            //   - "Laporan akhir belum disetujui"
            //   - "Sertifikat hanya diterbitkan untuk nilai minimal X"
            //   - "Data mahasiswa/kelompok/periode tidak ditemukan"
            Log::warning('Certificate download rejected', [
                'sertifikat_id' => $sertifikat->id,
                'user_id' => $user->id,
                'reason' => $e->getMessage(),
            ]);

            return $this->error('VALIDATION_ERROR', $e->getMessage(), 422);
        } catch (\Throwable $e) {
            // Unexpected failure (template missing, DomPDF crash, disk IO).
            // Do NOT let this propagate to global handler — global would
            // return JSON 500 but with a response body that the FE blob
            // reader would save as ".pdf". Return a controlled error envelope.
            Log::error('Certificate download failed', [
                'sertifikat_id' => $sertifikat->id,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->error(
                'SERVER_ERROR',
                'Gagal menghasilkan sertifikat. Silakan coba lagi atau hubungi admin.',
                500,
            );
        }
    }
}
