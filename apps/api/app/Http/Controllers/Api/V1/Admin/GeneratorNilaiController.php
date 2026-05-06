<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\NilaiKknResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\PesertaKkn;
use App\Services\GradeExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GeneratorNilaiController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly GradeExportService $exportService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $periodId = $request->input('periode_id');

        $groups = KelompokKkn::when($periodId, fn ($q) => $q->where('periode_id', $periodId))
            ->withCount('peserta')
            ->get();

        return $this->success([
            'groups' => $groups->map(fn ($g) => [
                'id' => $g->id,
                'name' => $g->nama_kelompok,
                'code' => $g->code,
                'member_count' => $g->peserta_count,
            ]),
        ]);
    }

    public function students(KelompokKkn $kelompokKkn): JsonResponse
    {
        $students = PesertaKkn::where('kelompok_id', $kelompokKkn->id)
            ->where('status', 'approved')
            ->with(['mahasiswa.user', 'mahasiswa.nilai' => fn ($q) => $q->where('kelompok_id', $kelompokKkn->id)])
            ->get();

        return $this->success([
            'students' => $students->map(fn ($s) => [
                'id' => $s->mahasiswa?->id,
                'nama' => $s->mahasiswa?->nama,
                'nim' => $s->mahasiswa?->nim,
                'nilai' => $s->mahasiswa?->nilai?->first() ? new NilaiKknResource($s->mahasiswa->nilai->first()) : null,
            ]),
        ]);
    }

    public function saveScores(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'scores' => ['required', 'array'],
            'scores.*.user_id' => ['required', 'integer'],
            'scores.*.kelompok_id' => ['required', 'integer'],
            'scores.*.scores' => ['required', 'array'],
        ]);

        $saved = 0;
        foreach ($validated['scores'] as $item) {
            NilaiKkn::updateOrCreate(
                ['user_id' => $item['user_id'], 'kelompok_id' => $item['kelompok_id']],
                array_merge($item['scores'], ['admin_graded_by' => auth()->id(), 'admin_graded_at' => now()])
            );
            $saved++;
        }

        return $this->success(['saved' => $saved], "{$saved} nilai berhasil disimpan.");
    }

    /**
     * Semua mahasiswa dari semua kelompok (untuk export massal).
     */
    public function studentsAll(Request $request): JsonResponse
    {
        $periodeId = $request->input('periode_id');

        $students = DB::table('mahasiswa as s')
            ->join('users as u', 's.user_id', '=', 'u.id')
            ->join('peserta_kkn as r', 's.id', '=', 'r.mahasiswa_id')
            ->join('kelompok_kkn as g', 'r.kelompok_id', '=', 'g.id')
            ->leftJoin('nilai_kkn as ks', function ($join) {
                $join->on('ks.user_id', '=', 'u.id')->on('ks.kelompok_id', '=', 'g.id');
            })
            ->when($periodeId, fn ($q) => $q->where('g.periode_id', $periodeId))
            ->whereIn('r.status', ['approved', 'pending'])
            ->select(['u.id as user_id', 'u.name', 's.nim', 'g.id as kelompok_id', 'g.code as group_code', 'ks.discipline_score as discipline', 'ks.attitude_score as attitude'])
            ->orderBy('g.code')->orderBy('u.name')
            ->get();

        return $this->success($students);
    }

    /**
     * Export Excel nilai per kelompok.
     */
    public function exportExcel(KelompokKkn $kelompokKkn)
    {
        $students = $this->getStudentsForGroup($kelompokKkn);

        return $this->exportService->exportExcel($kelompokKkn, $students);
    }

    /**
     * Export PDF nilai per kelompok.
     */
    public function exportPdf(KelompokKkn $kelompokKkn)
    {
        $students = $this->getStudentsForGroup($kelompokKkn);

        return $this->exportService->exportPdf($kelompokKkn, $students);
    }

    /**
     * Export ZIP semua kelompok dalam satu periode.
     */
    public function exportZip(Request $request)
    {
        $periodeId = $request->validate(['periode_id' => ['required', 'exists:periode,id']])['periode_id'];

        $groups = KelompokKkn::with(['lokasi', 'dosen.user', 'periode.tahunAkademik'])
            ->where('periode_id', $periodeId)
            ->orderBy('code')
            ->cursor();

        return $this->exportService->exportZip($groups, fn (KelompokKkn $g) => $this->getStudentsForGroup($g));
    }

    private function getStudentsForGroup(KelompokKkn $group): array
    {
        $registrations = PesertaKkn::with(['mahasiswa:id,user_id,nim,nama'])
            ->where('kelompok_id', $group->id)
            ->whereIn('status', ['approved', 'pending'])
            ->get();

        $userIds = $registrations->pluck('mahasiswa.user_id')->filter();
        $scores = NilaiKkn::where('kelompok_id', $group->id)
            ->whereIn('user_id', $userIds)
            ->get()
            ->keyBy('user_id');

        return $registrations->map(fn ($reg) => [
            'user_id' => $reg->mahasiswa->user_id,
            'name' => $reg->mahasiswa->nama,
            'nim' => $reg->mahasiswa->nim,
            'discipline' => $scores->get($reg->mahasiswa->user_id)?->discipline_score,
            'attitude' => $scores->get($reg->mahasiswa->user_id)?->attitude_score,
        ])->values()->toArray();
    }
}
