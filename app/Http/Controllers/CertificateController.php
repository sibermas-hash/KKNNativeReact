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

        // O(1) lookup with indexed verification token
        $matchedScore = NilaiKkn::where('verification_token', $token)
            ->where('is_finalized', true)
            ->with(['mahasiswa.user', 'kelompok.periode', 'kelompok.lokasi'])
            ->first();

        if ($matchedScore) {
            // Return masked data to protect student privacy
            $mahasiswa = $matchedScore->mahasiswa;
            return view('public.verify-certificate', [
                'token' => e($token),
                'is_valid' => true,
                'verified_at' => now(),
                'certificate_data' => [
                    'name' => substr($mahasiswa->nama ?? $mahasiswa->user->name, 0, 3) . '***',
                    'nim' => substr($mahasiswa->nim, 0, 6) . '***',
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
    public function downloadMass(Request $request)
    {
        $user = auth()->user();
        $isFacultyAdmin = $user->hasRole('faculty_admin');
        
        $query = NilaiKkn::query()
            ->where('is_finalized', true)
            ->with(['mahasiswa', 'kelompok.periode', 'kelompok.lokasi']);

        if ($isFacultyAdmin) {
            $query->whereHas('mahasiswa', fn($q) => $q->where('faculty_id', $user->faculty_id));
        }

        if ($request->filled('kelompok_id')) {
            $query->where('kelompok_id', $request->kelompok_id);
        }

        if ($request->filled('period_id')) {
            $query->whereHas('kelompok', fn($q) => $q->where('period_id', $request->period_id));
        }

        $scores = $query->get();

        if ($scores->isEmpty()) {
            return back()->withErrors(['error' => 'Tidak ada sertifikat yang ditemukan untuk diunduh.']);
        }

        return $this->certificateService->generateZip($scores);
    }

    public function preview(NilaiKkn $score)
    {
        $score->loadMissing(['mahasiswa', 'kelompok']);
        abort_if(!$score->is_finalized, 403, 'Sertifikat belum difinalisasi.');
        
        return $this->certificateService->generateForStudent($score)->stream();
    }
}
