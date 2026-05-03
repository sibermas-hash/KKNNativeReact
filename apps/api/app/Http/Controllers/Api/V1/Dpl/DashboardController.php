<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Dpl;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\KelompokKknResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\NilaiKkn;
use App\Services\DplScopeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    use ApiResponse;

    public function __construct(
        private DplScopeService $scopeService,
    ) {}

    public function index(): JsonResponse
    {
        $user = auth()->user();
        $dosen = $user->dosen;

        if (! $dosen) {
            return $this->success([
                'groups' => [],
                'pending_reports' => 0,
                'grading_progress' => '0%',
                'at_risk_students' => [],
                'activity_trend' => [],
                'coordinator_areas' => [],
            ]);
        }

        $groupIds = $this->scopeService->assignedGroupIds($dosen);

        $kelompok = KelompokKkn::whereIn('id', $groupIds)
            ->withCount(['peserta' => fn ($q) => $q->where('status', 'approved'), 'kegiatan'])
            ->with(['lokasi', 'periode'])
            ->get();

        $pendingReports = KegiatanKkn::whereIn('kelompok_id', $groupIds)
            ->workflowSubmitted()
            ->count();

        $totalStudents = $kelompok->sum('peserta_count');
        $gradedCount = NilaiKkn::whereIn('kelompok_id', $groupIds)->whereNotNull('dpl_graded_at')->count();
        $gradingProgress = $totalStudents > 0 ? round(($gradedCount / $totalStudents) * 100) : 0;

        $atRiskStudents = $totalStudents > 0
            ? Mahasiswa::query()
                ->select(['id', 'user_id', 'nama', 'nim'])
                ->whereHas('peserta', fn ($q) => $q->whereIn('kelompok_id', $groupIds)->where('status', 'approved'))
                ->whereNotExists(fn ($q) => $q->select(DB::raw(1))->from('kegiatan_kkn')
                    ->whereColumn('kegiatan_kkn.mahasiswa_id', 'mahasiswa.id')
                    ->where('kegiatan_kkn.date', '>=', now()->subDays(3)->format('Y-m-d')))
                ->with(['user:id,name', 'peserta' => fn ($q) => $q->whereIn('kelompok_id', $groupIds)->select(['id', 'mahasiswa_id', 'kelompok_id']), 'peserta.kelompok:id,code'])
                ->get()
            : collect();

        $activityTrend = KegiatanKkn::whereIn('kelompok_id', $groupIds)
            ->where('date', '>=', now()->subDays(14))
            ->selectRaw('date, count(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return $this->success([
            'groups' => $kelompok->map(fn ($g) => [
                'id' => $g->id,
                'code' => $g->code,
                'name' => $g->nama_kelompok,
                'period_name' => $g->periode?->name ?? '-',
                'jenis_kkn' => $g->periode?->jenis_label ?? '-',
                'village_name' => $g->lokasi?->village_name ?? '-',
                'member_count' => $g->peserta_count,
                'daily_report_count' => $g->kegiatan_count,
            ])->values(),
            'pending_reports' => $pendingReports,
            'grading_progress' => "{$gradingProgress}%",
            'at_risk_students' => $atRiskStudents->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->user?->name ?? $s->nama,
                'nim' => $s->nim,
                'group_code' => $s->peserta->first()?->kelompok?->code ?? '-',
            ])->values(),
            'activity_trend' => $activityTrend->map(fn ($item) => [
                'date' => (string) $item->date,
                'count' => (int) $item->count,
            ])->values(),
            'coordinator_areas' => $this->scopeService->coordinatorAreaSummaries($dosen),
        ]);
    }
}
