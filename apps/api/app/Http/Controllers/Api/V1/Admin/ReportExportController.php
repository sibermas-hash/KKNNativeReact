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
        if ($user->hasRole('dpl') && ! $user->hasAnyRole(['superadmin', 'admin'])) {
            $dosen = Dosen::where('user_id', $user->id)->firstOrFail();
            $groupIds = $dosen->kelompokKkn()->pluck('kelompok_kkn.id');
            $inGroup = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
                ->whereIn('kelompok_id', $groupIds)
                ->exists();
            abort_unless($inGroup, 403, 'Mahasiswa bukan anggota kelompok Anda.');
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

        $kelompok = KelompokKkn::findOrFail($groupId);

        // DPL hanya bisa download laporan kelompoknya sendiri
        if ($user->hasRole('dpl') && ! $user->hasAnyRole(['superadmin', 'admin'])) {
            $dosen = Dosen::where('user_id', $user->id)->firstOrFail();
            $isAssigned = $dosen->kelompokKkn()->where('kelompok_kkn.id', $groupId)->exists();
            abort_unless($isAssigned, 403, 'Anda tidak memiliki akses ke kelompok ini.');
        }

        $pdf = $this->compilationService->generateForGroup($groupId);
        $filename = 'Ringkasan_Laporan_Kelompok_' . $kelompok->code . '.pdf';

        return $pdf->download($filename);
    }
}
