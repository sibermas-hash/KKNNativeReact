<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\CertificateService;
use Inertia\Inertia;

class CertificateVerificationController extends Controller
{
    /**
     * Tampilkan halaman verifikasi sertifikat publik.
     */
    public function verify(string $token, CertificateService $certificateService)
    {
        $sertifikat = $certificateService->findByToken($token);

        if ($sertifikat) {
            $sertifikat->loadMissing(['periode:id,name']);
        }

        return Inertia::render('Public/CertificateVerify', [
            'sertifikat' => $sertifikat,
            'token' => $token,
        ]);
    }
}
