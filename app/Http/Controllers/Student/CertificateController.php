<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\KKN\LaporanAkhir;
use App\Models\KKN\NilaiKkn;
use App\Services\CertificateService;
use Inertia\Inertia;

class CertificateController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $mahasiswa = $user->mahasiswa;

        if (! $mahasiswa) {
            return Inertia::render('Student/Certificate/Index', [
                'eligible' => false,
                'reason' => 'Data mahasiswa tidak ditemukan.',
            ]);
        }

        // Ambil Nilai KKN (Hasil Final dari LPPM)
        $score = NilaiKkn::where('user_id', $user->id)
            ->with(['kelompok.periode'])
            ->first();

        // Ambil Status Laporan Akhir
        $laporanAkhir = LaporanAkhir::where('mahasiswa_id', $mahasiswa->id)->first();

        $checks = [
            'has_score' => $score !== null,
            'is_finalized' => $score?->is_finalized ?? false,
            'report_approved' => ($laporanAkhir?->status === 'approved'),
            'min_grade' => ($score?->total_score >= 70),
        ];

        $eligible = ! in_array(false, $checks, true);

        return Inertia::render('Student/Certificate/Index', [
            'eligible' => $eligible,
            'checks' => $checks,
            'score' => $score,
            'laporan_akhir_status' => $laporanAkhir?->status ?? 'pending',
            'certificate_url' => $eligible ? route('student.certificate.download', $score->id) : null,
        ]);
    }

    public function download($id, CertificateService $certificateService)
    {
        $user = auth()->user();

        $score = NilaiKkn::where('id', $id)
            ->where('user_id', $user->id)
            ->where('is_finalized', true)
            ->firstOrFail();

        try {
            $pdf = $certificateService->generateForStudent($score);
            $nim = $score->mahasiswa->nim ?? 'Unknown';

            return $pdf->download("Sertifikat_KKN_{$nim}.pdf");
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
