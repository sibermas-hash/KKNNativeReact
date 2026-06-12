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
use App\Services\GradingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GeneratorNilaiController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly GradeExportService $exportService
    ) {}

    private function facultyScopeId(): ?int
    {
        $user = auth()->user();

        return $user?->hasRole('faculty_admin') && $user->fakultas_id
            ? (int) $user->fakultas_id
            : null;
    }

    private function scopeGroupsByFaculty($query): void
    {
        if ($facultyId = $this->facultyScopeId()) {
            $query->whereHas('peserta.mahasiswa', fn ($q) => $q->where('fakultas_id', $facultyId));
        }
    }

    private function ensureGroupInFacultyScope(KelompokKkn $group): void
    {
        if ($facultyId = $this->facultyScopeId()) {
            abort_unless(
                PesertaKkn::where('kelompok_id', $group->id)
                    ->whereHas('mahasiswa', fn ($q) => $q->where('fakultas_id', $facultyId))
                    ->exists(),
                403,
                'Anda tidak memiliki akses ke kelompok ini.'
            );
        }
    }

    public function index(Request $request): JsonResponse
    {
        $periodId = $request->input('periode_id');

        $groups = KelompokKkn::when($periodId, fn ($q) => $q->where('periode_id', $periodId))
            ->whereHas('periode', fn ($q) => $q->where('is_active', true))
            ->withCount('peserta');

        $this->scopeGroupsByFaculty($groups);

        $groups = $groups->get();

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
        abort_unless($kelompokKkn->periode?->is_active, 404, 'Data ini bukan dari periode aktif.');
        $this->ensureGroupInFacultyScope($kelompokKkn);

        $students = PesertaKkn::where('kelompok_id', $kelompokKkn->id)
            ->when($this->facultyScopeId(), fn ($q, $facultyId) => $q->whereHas('mahasiswa', fn ($m) => $m->where('fakultas_id', $facultyId)))
            ->where('status', 'approved')
            ->with(['mahasiswa.user', 'mahasiswa.nilai' => fn ($q) => $q->where('kelompok_id', $kelompokKkn->id)])
            ->get();

        return $this->success([
            'students' => $students->map(fn ($s) => [
                'id' => $s->mahasiswa?->id,
                'user_id' => $s->mahasiswa?->user_id,
                'nama' => $s->mahasiswa?->nama,
                'nim' => $s->mahasiswa?->nim,
                'nilai' => $s->mahasiswa?->nilai?->first() ? new NilaiKknResource($s->mahasiswa->nilai->first()) : null,
            ]),
        ]);
    }

    public function saveScores(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'scores' => ['required', 'array', 'min:1', 'max:200'],
            'scores.*.user_id' => ['required', 'integer'],
            'scores.*.kelompok_id' => ['required', 'integer'],
            'scores.*.scores' => ['required', 'array:discipline_score,attitude_score,execution_score,article_score,final_report_score,workshop_score,administration_score'],
            'scores.*.scores.discipline_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'scores.*.scores.attitude_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'scores.*.scores.execution_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'scores.*.scores.article_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'scores.*.scores.final_report_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'scores.*.scores.workshop_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'scores.*.scores.administration_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $allowedScoreFields = [
            'discipline_score', 'attitude_score', 'execution_score', 'article_score',
            'final_report_score', 'workshop_score', 'administration_score',
        ];

        $saved = 0;
        $skipped = 0;
        $invalid = [];

        foreach ($validated['scores'] as $index => $item) {
            $unknownFields = array_diff(array_keys($item['scores']), $allowedScoreFields);
            if ($unknownFields !== []) {
                $invalid[] = ['index' => $index, 'reason' => 'UNKNOWN_SCORE_FIELDS', 'fields' => array_values($unknownFields)];
                continue;
            }

            $scoreValues = array_intersect_key($item['scores'], array_flip($allowedScoreFields));
            if ($scoreValues === []) {
                $invalid[] = ['index' => $index, 'reason' => 'EMPTY_SCORE_FIELDS'];
                continue;
            }

            $group = KelompokKkn::with('periode')->find($item['kelompok_id']);
            if (! $group?->periode?->is_active) {
                $skipped++;
                continue;
            }

            $inGroup = PesertaKkn::where('kelompok_id', $item['kelompok_id'])
                ->whereHas('mahasiswa', function ($q) use ($item) {
                    $q->where('user_id', $item['user_id']);

                    if ($facultyId = $this->facultyScopeId()) {
                        $q->where('fakultas_id', $facultyId);
                    }
                })
                ->where('status', 'approved')
                ->exists();

            if (! $inGroup) {
                $skipped++;
                continue;
            }

            $score = NilaiKkn::updateOrCreate(
                ['user_id' => $item['user_id'], 'kelompok_id' => $item['kelompok_id']],
                array_merge($scoreValues, ['admin_graded_by' => auth()->id(), 'admin_graded_at' => now()])
            );

            app(GradingService::class)->calculateFinalGrade($score);

            $saved++;
        }

        if ($invalid !== []) {
            return $this->error('INVALID_SCORE_FIELDS', 'Payload nilai berisi field tidak valid.', 422, ['invalid' => $invalid]);
        }

        return $this->success(['saved' => $saved, 'skipped' => $skipped], "{$saved} nilai berhasil disimpan.");
    }


    private function requireSuperadminForBulkExport(): ?JsonResponse
    {
        if (! auth()->user()?->hasRole('superadmin')) {
            return $this->error('FORBIDDEN', 'Export massal generator nilai hanya untuk Super Admin.', 403);
        }

        return null;
    }

    /**
     * Semua mahasiswa dari semua kelompok (untuk export massal).
     */
    public function studentsAll(Request $request): JsonResponse
    {
        if ($forbidden = $this->requireSuperadminForBulkExport()) {
            return $forbidden;
        }

        $periodeId = $request->input('periode_id');

        $students = DB::table('mahasiswa as s')
            ->join('users as u', 's.user_id', '=', 'u.id')
            ->join('peserta_kkn as r', 's.id', '=', 'r.mahasiswa_id')
            ->join('kelompok_kkn as g', 'r.kelompok_id', '=', 'g.id')
            ->leftJoin('nilai_kkn as ks', function ($join) {
                $join->on('ks.user_id', '=', 'u.id')->on('ks.kelompok_id', '=', 'g.id');
            })
            ->join('periode as p', 'g.periode_id', '=', 'p.id')
            ->where('p.is_active', true)
            ->when($periodeId, fn ($q) => $q->where('g.periode_id', $periodeId))
            ->when($this->facultyScopeId(), fn ($q, $facultyId) => $q->where('s.fakultas_id', $facultyId))
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
        $this->ensureGroupInFacultyScope($kelompokKkn);

        $students = $this->getStudentsForGroup($kelompokKkn);

        return $this->exportService->exportExcel($kelompokKkn, $students);
    }

    /**
     * Export PDF nilai per kelompok.
     */
    public function exportPdf(KelompokKkn $kelompokKkn)
    {
        if ($forbidden = $this->requireSuperadminForBulkExport()) {
            return $forbidden;
        }

        $this->ensureGroupInFacultyScope($kelompokKkn);

        $students = $this->getStudentsForGroup($kelompokKkn);

        return $this->exportService->exportPdf($kelompokKkn, $students);
    }

    /**
     * Export ZIP semua kelompok dalam satu periode.
     */
    public function exportZip(Request $request)
    {
        if ($forbidden = $this->requireSuperadminForBulkExport()) {
            return $forbidden;
        }

        $periodeId = $request->validate(['periode_id' => ['required', 'exists:periode,id']])['periode_id'];

        $groups = KelompokKkn::with(['lokasi', 'dosen.user', 'periode.tahunAkademik'])
            ->where('periode_id', $periodeId)
            ->whereHas('periode', fn ($q) => $q->where('is_active', true))
            ->orderBy('code');

        $this->scopeGroupsByFaculty($groups);

        $groups = $groups->cursor();

        return $this->exportService->exportZip($groups, fn (KelompokKkn $g) => $this->getStudentsForGroup($g));
    }

    private function getStudentsForGroup(KelompokKkn $group): array
    {
        $registrations = PesertaKkn::with(['mahasiswa:id,user_id,nim,nama,fakultas_id'])
            ->where('kelompok_id', $group->id)
            ->when($this->facultyScopeId(), fn ($q, $facultyId) => $q->whereHas('mahasiswa', fn ($m) => $m->where('fakultas_id', $facultyId)))
            ->whereIn('status', ['approved', 'pending'])
            ->get();

        $userIds = $registrations->pluck('mahasiswa.user_id')->filter();
        $scores = NilaiKkn::where('kelompok_id', $group->id)
            ->whereIn('user_id', $userIds)
            ->get()
            ->keyBy('user_id');

        return $registrations
            ->filter(fn (PesertaKkn $reg) => $reg->mahasiswa !== null)
            ->map(function (PesertaKkn $reg) use ($scores) {
                $mahasiswa = $reg->mahasiswa;
                $score = $scores->get($mahasiswa->user_id);

                return [
                    'user_id' => $mahasiswa->user_id,
                    'name' => $mahasiswa->nama,
                    'nim' => $mahasiswa->nim,
                    'discipline' => $score?->discipline_score,
                    'attitude' => $score?->attitude_score,
                    'total_score' => $score?->total_score,
                    'letter_grade' => $score?->letter_grade,
                ];
            })->values()->toArray();
    }
}
