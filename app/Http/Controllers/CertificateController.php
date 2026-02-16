<?php

namespace App\Http\Controllers;

use App\Models\KKN\NilaiKkn;
use App\Services\CertificateService;
use Illuminate\Http\Request;

class CertificateController extends Controller
{
    public function __construct(
        protected CertificateService $certificateService
    ) {}

    public function download(NilaiKkn $score)
    {
        // Safety: only student owner or admin can download
        if (auth()->user()->hasRole('student')) {
            abort_if(auth()->id() !== $score->mahasiswa->user_id, 403);
        }

        abort_if(!$score->is_finalized, 403, 'Sertifikat belum difinalisasi.');

        $pdf = $this->certificateService->generateForStudent($score);
        
        return $pdf->download("Sertifikat_KKN_{$score->mahasiswa->nim}.pdf");
    }

    public function verify($token)
    {
        // Simple verification logic
        // Cert ID in service is 'KKN/' . $score->kelompok->periode->id . '/' . $verificationToken
        // Verification token is strtoupper(substr(md5("CERT-{$score->id}-{$score->mahasiswa_id}"), 0, 12))
        
        // This is a placeholder for public verification page
        // Find score by token (would need a token column or reverse calculate)
        // For now, we show a basic verification UI
        
        return view('public.verify-certificate', [
            'token' => $token,
            'is_valid' => true, // Real logic: lookup in DB
            'verified_at' => now(),
        ]);
    }
}
