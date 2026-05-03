<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\PeriodeResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\PesertaKkn;
use App\Services\DashboardStatisticsService;
use App\Services\PeriodContextService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use ApiResponse;

    public function hub(): JsonResponse
    {
        $user = auth()->user();

        return $this->success([
            'user' => [
                'name' => $user->name,
                'roles' => $user->getRoleNames()->toArray(),
            ],
            'quick_links' => [
                ['label' => 'Dashboard', 'route' => 'admin.dashboard'],
                ['label' => 'Pendaftaran', 'route' => 'admin.pendaftaran.index'],
                ['label' => 'Kelompok', 'route' => 'admin.kelompok.index'],
                ['label' => 'Laporan Harian', 'route' => 'admin.laporan.harian.index'],
                ['label' => 'Rekap Nilai', 'route' => 'admin.grade-reports.index'],
                ['label' => 'Pengaturan', 'route' => 'admin.pengaturan.sistem'],
            ],
        ]);
    }

    public function index(Request $request, PeriodContextService $periodContextService): JsonResponse
    {
        $periodId = $request->input('periode_id')
            ?? $periodContextService->getActivePeriodId()
            ?? $periodContextService->getDefaultPeriodId();

        if (! $periodId) {
            return $this->success(['stats' => null, 'period' => null]);
        }

        $stats = app(DashboardStatisticsService::class)->getPeriodStatistics($periodId);

        return $this->success([
            'stats' => $stats,
            'period' => new PeriodeResource(
                \App\Models\KKN\Periode::with(['tahunAkademik', 'jenisKkn'])->find($periodId)
            ),
        ]);
    }

    public function switchPhase(Request $request): JsonResponse
    {
        $request->validate([
            'periode_id' => ['required', 'exists:periode,id'],
            'phase' => ['required', 'string', 'in:upcoming,registration,placement,execution,grading,finished'],
        ]);

        $period = \App\Models\KKN\Periode::findOrFail($request->input('periode_id'));
        $period->update(['current_phase' => $request->input('phase')]);

        return $this->success(
            new PeriodeResource($period->refresh()),
            "Fase berhasil diubah ke {$request->input('phase')}."
        );
    }
}
