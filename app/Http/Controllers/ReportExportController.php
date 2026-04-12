<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use App\Services\DailyReportCompilationService;
use Symfony\Component\HttpFoundation\Response;

class ReportExportController extends Controller
{
    public function __construct(
        private DailyReportCompilationService $compilationService
    ) {}

    /**
     * Download student's own daily report compilation.
     */
    public function downloadMyDailyReports(): Response
    {
        $userId = auth()->id();
        $user = auth()->user();

        $pdf = $this->compilationService->generateForStudent($userId);
        $filename = "Laporan_Harian_KKN_{$user->name}.pdf";

        return $pdf->download($filename);
    }

    /**
     * Download daily report compilation for a specific student (Admin/DPL).
     */
    public function downloadStudentDailyReports(int $studentId): Response
    {
        $user = auth()->user();
        abort_unless(
            $user->hasAnyRole(['superadmin', 'dpl']),
            403,
            'Anda tidak memiliki akses untuk mengunduh laporan mahasiswa.'
        );

        $mahasiswa = Mahasiswa::with('user')->findOrFail($studentId);

        // DPL can only download reports for students in their groups
        if ($user->hasRole('dpl') && ! $user->hasRole('superadmin')) {
            $dosen = \App\Models\KKN\Dosen::where('user_id', $user->id)->first();
            abort_unless($dosen, 403);
            $groupIds = $dosen->kelompokKkn()->pluck('kelompok_kkn.id');
            $inGroup = \App\Models\KKN\PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
                ->whereIn('kelompok_id', $groupIds)->exists();
            abort_unless($inGroup, 403, 'Mahasiswa bukan anggota kelompok Anda.');
        }

        $pdf = $this->compilationService->generateForStudent($mahasiswa->user_id);
        $filename = "Laporan_Harian_KKN_{$mahasiswa->user->name}.pdf";

        return $pdf->download($filename);
    }

    /**
     * Download daily report summary for a group (Admin/DPL).
     */
    public function downloadGroupDailyReports(int $groupId): Response
    {
        $user = auth()->user();
        abort_unless(
            $user->hasAnyRole(['superadmin', 'dpl']),
            403,
            'Anda tidak memiliki akses untuk mengunduh laporan kelompok.'
        );

        $kelompok = KelompokKkn::findOrFail($groupId);

        // DPL can only download reports for their own groups
        if ($user->hasRole('dpl') && ! $user->hasRole('superadmin')) {
            $dosen = \App\Models\KKN\Dosen::where('user_id', $user->id)->first();
            abort_unless($dosen, 403);
            $isAssigned = $dosen->kelompokKkn()->where('kelompok_kkn.id', $groupId)->exists();
            abort_unless($isAssigned, 403, 'Anda tidak memiliki akses ke kelompok ini.');
        }

        $pdf = $this->compilationService->generateForGroup($groupId);
        $filename = "Ringkasan_Laporan_Kelompok_{$kelompok->code}.pdf";

        return $pdf->download($filename);
    }
}
