<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Dpl;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\NilaiKknResource;
use App\Http\Resources\Api\V1\MahasiswaResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\KonfigurasiPenilaian;
use App\Models\KKN\NilaiKkn;
use App\Services\DplScopeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EvaluationController extends Controller
{
    use ApiResponse;

    public function __construct(
        private DplScopeService $scopeService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $dosen = auth()->user()->dosen;
        if (! $dosen) {
            return $this->success(['evaluations' => [], 'students' => [], 'config' => null]);
        }

        $groupIds = $this->scopeService->assignedGroupIds($dosen);
        $periodId = $request->input('periode_id');

        $scores = NilaiKkn::whereIn('kelompok_id', $groupIds)
            ->when($periodId, fn ($q) => $q->whereHas('kelompok', fn ($q2) => $q2->where('periode_id', $periodId)))
            ->with(['user:id,name,username', 'kelompok:id,code,nama_kelompok'])
            ->paginate($request->input('per_page', 25));

        $students = \App\Models\KKN\PesertaKkn::whereIn('kelompok_id', $groupIds)
            ->where('status', 'approved')
            ->with(['mahasiswa:id,user_id,nama,nim', 'kelompok:id,nama_kelompok'])
            ->limit(100)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->mahasiswa?->id,
                'user_id' => $p->mahasiswa?->user_id,
                'name' => $p->mahasiswa?->nama ?? '-',
                'nim' => $p->mahasiswa?->nim ?? '-',
                'group_id' => $p->kelompok_id,
                'group_name' => $p->kelompok?->nama_kelompok ?? '-',
            ]);

        $config = KonfigurasiPenilaian::when($periodId, fn ($q) => $q->where('periode_id', $periodId))->first();

        return $this->success([
            'evaluations' => NilaiKknResource::collection($scores),
            'students' => $students,
            'config' => $config ? [
                'dpl_weight' => $config->dpl_weight,
                'village_weight' => $config->village_weight,
                'lppm_weight' => $config->lppm_weight,
            ] : null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => ['required', 'integer'],
            'kelompok_id' => ['required', 'integer'],
            'scores' => ['required', 'array'],
            'scores.dpl_relevansi_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'scores.dpl_ketercapaian_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'scores.dpl_inovasi_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'scores.dpl_administrasi_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'scores.dpl_artikel_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $dosen = auth()->user()->dosen;
        $groupIds = $dosen->kelompokKkn()->pluck('kelompok_kkn.id');

        if (! $groupIds->contains($request->input('kelompok_id'))) {
            return $this->forbidden('Anda tidak memiliki akses ke kelompok ini.');
        }

        $scores = $request->input('scores');

        $nilai = NilaiKkn::updateOrCreate(
            ['user_id' => $request->input('student_id'), 'kelompok_id' => $request->input('kelompok_id')],
            [
                'dpl_relevansi_score' => $scores['dpl_relevansi_score'] ?? null,
                'dpl_ketercapaian_score' => $scores['dpl_ketercapaian_score'] ?? null,
                'dpl_inovasi_score' => $scores['dpl_inovasi_score'] ?? null,
                'dpl_administrasi_score' => $scores['dpl_administrasi_score'] ?? null,
                'dpl_artikel_score' => $scores['dpl_artikel_score'] ?? null,
                'dpl_graded_by' => auth()->id(),
                'dpl_graded_at' => now(),
            ]
        );

        return $this->success(new NilaiKknResource($nilai), 'Nilai DPL berhasil disimpan.');
    }

    public function validateImport(Request $request): JsonResponse
    {
        $request->validate(['file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240']]);

        // Parse and validate import data
        $file = $request->file('file');
        $data = $this->parseImportFile($file);

        return $this->success([
            'preview' => $data['rows'],
            'total_rows' => $data['total'],
            'valid_rows' => $data['valid'],
            'errors' => $data['errors'],
        ]);
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'data' => ['required', 'array'],
            'data.*.user_id' => ['required', 'integer'],
            'data.*.kelompok_id' => ['required', 'integer'],
        ]);

        $imported = 0;
        \Illuminate\Support\Facades\DB::transaction(function () use ($request, &$imported) {
            foreach ($request->input('data') as $row) {
                NilaiKkn::updateOrCreate(
                    ['user_id' => $row['user_id'], 'kelompok_id' => $row['kelompok_id']],
                    array_merge($row, ['dpl_graded_by' => auth()->id(), 'dpl_graded_at' => now()])
                );
                $imported++;
            }
        });

        return $this->success(['imported_count' => $imported], "{$imported} nilai berhasil diimpor.");
    }

    private function parseImportFile($file): array
    {
        // Placeholder — implement with maatwebsite/excel
        return ['rows' => [], 'total' => 0, 'valid' => 0, 'errors' => []];
    }
}
