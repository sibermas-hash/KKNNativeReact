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
        $user = auth()->user();
        $score->loadMissing(['mahasiswa', 'kelompok']);

        // Student: can only download their own certificate
        if ($user->hasRole('student')) {
            abort_if(auth()->id() !== $score->mahasiswa->user_id, 403);
        }
        // DPL: can only download certificates for students in their groups
        elseif ($user->hasRole('dpl')) {
            $dosen = $user->dosen;
            abort_if(!$dosen, 403, 'Data dosen tidak ditemukan.');
            $groupIds = $dosen->kelompokKkn()->pluck('kelompok_kkn.id');
            abort_if(!$groupIds->contains($score->kelompok_id), 403, 'Anda tidak memiliki akses ke sertifikat ini.');
        }
        // Superadmin: unrestricted access (handled by Gate::before)

        abort_if(!$score->is_finalized, 403, 'Sertifikat belum difinalisasi.');

        $pdf = $this->certificateService->generateForStudent($score);

        return $pdf->download("Sertifikat_KKN_{$score->mahasiswa->nim}.pdf");
    }

    public function verify($token)
    {
        // Sanitize token - only allow alphanumeric characters
        $token = preg_replace('/[^A-Za-z0-9]/', '', $token);

        // Reverse-lookup: find score by computing token for each finalized score
        // Token formula: strtoupper(substr(hash('sha256', "CERT-{id}-{mahasiswa_id}-{APP_KEY}"), 0, 16)))
        $matchedScore = NilaiKkn::where('is_finalized', true)
            ->with(['mahasiswa.user', 'kelompok.periode', 'kelompok.lokasi'])
            ->get()
            ->first(function ($score) use ($token) {
                return CertificateService::generateVerificationToken($score) === $token;
            });

        if ($matchedScore) {
            return view('public.verify-certificate', [
                'token' => e($token),
                'is_valid' => true,
                'verified_at' => now(),
                'certificate_data' => [
                    'name' => $matchedScore->mahasiswa->nama ?? $matchedScore->mahasiswa->user->name,
                    'nim' => $matchedScore->mahasiswa->nim,
                    'period' => $matchedScore->kelompok->periode->name ?? '-',
                    'location' => $matchedScore->kelompok->lokasi->village_name ?? '-',
                    'grade' => $matchedScore->letter_grade,
                ],
            ]);
        }

        return view('public.verify-certificate', [
            'token' => e($token),
            'is_valid' => false,
            'verified_at' => now(),
            'certificate_data' => null,
        ]);
    }
}
