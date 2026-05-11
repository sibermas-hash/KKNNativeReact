<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Dosen;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaKkn;
use App\Services\DailyReportCompilationService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class ReportExportController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly DailyReportCompilationService $compilationService
    ) {}

    /**
     * Download PDF laporan harian per mahasiswa (Admin/DPL).
     */
    public function downloadStudentDailyReports(int $studentId): Response
    {
        $user = auth()->user();

        $mahasiswa = Mahasiswa::with('user')->findOrFail($studentId);

        // DPL hanya bisa download laporan mahasiswa di kelompoknya
        if ($user->hasRole('dpl') && ! $user->hasAnyRole(['superadmin', 'admin', 'faculty_admin'])) {
            $dosen = Dosen::where('user_id', $user->id)->firstOrFail();
            $groupIds = $dosen->kelompokKkn()->pluck('kelompok_kkn.id');
            $inGroup = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
                ->whereIn('kelompok_id', $groupIds)
                ->exists();
            abort_unless($inGroup, 403, 'Mahasiswa bukan anggota kelompok Anda.');
        }

        // Faculty admin hanya bisa download laporan mahasiswa di fakultasnya
        if ($user->hasRole('faculty_admin') && ! $user->hasAnyRole(['superadmin', 'admin'])) {
            abort_unless(
                $mahasiswa->fakultas_id === $user->fakultas_id,
                403,
                'Mahasiswa bukan dari fakultas Anda.'
            );
        }

        $pdf = $this->compilationService->generateForStudent($mahasiswa->user_id);
        $filename = 'Laporan_Harian_KKN_' . str_replace(' ', '_', $mahasiswa->user->name) . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Download PDF ringkasan laporan harian per kelompok (Admin/DPL).
     */
    public function downloadGroupDailyReports(int $groupId): Response
    {
        $user = auth()->user();

        $kelompok = KelompokKkn::with('peserta.mahasiswa')->findOrFail($groupId);

        // DPL hanya bisa download laporan kelompoknya sendiri
        if ($user->hasRole('dpl') && ! $user->hasAnyRole(['superadmin', 'admin', 'faculty_admin'])) {
            $dosen = Dosen::where('user_id', $user->id)->firstOrFail();
            $isAssigned = $dosen->kelompokKkn()->where('kelompok_kkn.id', $groupId)->exists();
            abort_unless($isAssigned, 403, 'Anda tidak memiliki akses ke kelompok ini.');
        }

        // Faculty admin: cek apakah kelompok ini punya mahasiswa dari fakultasnya
        if ($user->hasRole('faculty_admin') && ! $user->hasAnyRole(['superadmin', 'admin'])) {
            $hasFacultyMember = $kelompok->peserta
                ->contains(fn ($p) => $p->mahasiswa?->fakultas_id === $user->fakultas_id);
            abort_unless($hasFacultyMember, 403, 'Kelompok ini tidak memiliki mahasiswa dari fakultas Anda.');
        }

        $pdf = $this->compilationService->generateForGroup($groupId);
        $filename = 'Ringkasan_Laporan_Kelompok_' . $kelompok->code . '.pdf';

        return $pdf->download($filename);
    }
}
