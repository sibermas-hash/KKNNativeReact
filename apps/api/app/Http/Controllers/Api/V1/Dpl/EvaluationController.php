<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Dpl;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\NilaiKknResource;
use App\Http\Traits\ApiResponse;
use App\Imports\EvaluationImport;
use App\Models\KKN\KonfigurasiPenilaian;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\PesertaKkn;
use App\Services\DplScopeService;
use App\Services\GradingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

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

        $students = PesertaKkn::whereIn('kelompok_id', $groupIds)
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

        $configs = KonfigurasiPenilaian::pluck('percentage', 'config_key');

        return $this->success([
            'evaluations' => NilaiKknResource::collection($scores),
            'students' => $students,
            'config' => $configs->isNotEmpty() ? [
                'dpl_weight' => $configs['weight_main_dpl'] ?? 40,
                'village_weight' => $configs['weight_main_village'] ?? 20,
                'lppm_weight' => $configs['weight_main_lppm'] ?? 40,
            ] : null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => ['required', 'integer'],
            'kelompok_id' => ['required', 'integer'],
            'scores' => ['required', 'array'],
            'scores.relevansi' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'scores.ketercapaian' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'scores.inovasi' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'scores.administrasi' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'scores.artikel' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $dosen = auth()->user()->dosen;
        $groupIds = $dosen->kelompokKkn()->pluck('kelompok_kkn.id');

        if (! $groupIds->contains($request->input('kelompok_id'))) {
            return $this->forbidden('Anda tidak memiliki akses ke kelompok ini.');
        }

        // Verify student is registered in the specified group with approved status
        $studentInGroup = PesertaKkn::where('kelompok_id', $request->input('kelompok_id'))
            ->whereHas('mahasiswa', fn ($q) => $q->where('user_id', $request->input('student_id')))
            ->where('status', 'approved')
            ->exists();

        if (! $studentInGroup) {
            return $this->forbidden('Mahasiswa tidak terdaftar di kelompok Anda.');
        }

        try {
            $nilai = app(GradingService::class)->submitDPLScores(
                userId: $request->input('student_id'),
                groupId: $request->input('kelompok_id'),
                scores: $request->input('scores'),
                dplId: auth()->id(),
            );
        } catch (\DomainException $e) {
            return $this->error('VALIDATION_ERROR', $e->getMessage(), 422);
        }

        return $this->success(new NilaiKknResource($nilai), 'Nilai DPL berhasil disimpan.');
    }

    public function validateImport(Request $request): JsonResponse
    {
        $request->validate(['file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240']]);

        try {
            $file = $request->file('file');
            $import = new EvaluationImport;
            Excel::import($import, $file);

            return $this->success([
                'preview' => $import->rows,
                'total_rows' => $import->totalRows,
                'valid_rows' => $import->validRows,
                'errors' => $import->errors,
            ]);
        } catch (\Exception $e) {
            return $this->error('VALIDATION_ERROR', 'Gagal memproses file: '.$e->getMessage(), 422);
        }
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'data' => ['required', 'array', 'max:100'],
            'data.*.user_id' => ['required', 'integer'],
            'data.*.kelompok_id' => ['required', 'integer'],
            'data.*.relevansi' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'data.*.ketercapaian' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'data.*.inovasi' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'data.*.administrasi' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'data.*.artikel' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $dosen = auth()->user()->dosen;
        $groupIds = $dosen->kelompokKkn()->pluck('kelompok_kkn.id');

        $validRows = [];
        $errors = [];

        // Validate all rows first before any DB writes (BH-06: atomic consistency)
        foreach ($request->input('data') as $index => $row) {
            if (! $groupIds->contains($row['kelompok_id'])) {
                $errors[] = "Baris {$index}: Kelompok tidak dalam binaan Anda.";

                continue;
            }

            // BC-03: verify student is in the group
            $inGroup = PesertaKkn::where('kelompok_id', $row['kelompok_id'])
                ->whereHas('mahasiswa', fn ($q) => $q->where('user_id', $row['user_id']))
                ->where('status', 'approved')
                ->exists();

            if (! $inGroup) {
                $errors[] = "Baris {$index}: Mahasiswa tidak terdaftar di kelompok tersebut.";

                continue;
            }

            $validRows[] = $row;
        }

        $imported = 0;
        if (! empty($validRows)) {
            DB::transaction(function () use ($validRows, &$imported) {
                $gradingService = app(GradingService::class);
                foreach ($validRows as $row) {
                    $score = NilaiKkn::updateOrCreate(
                        ['user_id' => $row['user_id'], 'kelompok_id' => $row['kelompok_id']],
                        [
                            'dpl_relevansi_score' => $row['relevansi'] ?? 0,
                            'dpl_ketercapaian_score' => $row['ketercapaian'] ?? 0,
                            'dpl_inovasi_score' => $row['inovasi'] ?? 0,
                            'dpl_administrasi_score' => $row['administrasi'] ?? 0,
                            'dpl_artikel_score' => $row['artikel'] ?? 0,
                            'dpl_graded_by' => auth()->id(),
                            'dpl_graded_at' => now(),
                        ]
                    );

                    // G-06 fix: recalc after import
                    $gradingService->calculateFinalGrade($score);

                    $imported++;
                }
            });
        }

        return $this->success([
            'imported_count' => $imported,
            'errors' => $errors,
        ], "{$imported} nilai berhasil diimport.");
    }

    private function parseImportFile($file): array
    {
        $import = new EvaluationImport;
        Excel::import($import, $file);

        return [
            'rows' => $import->rows ?? [],
            'total' => $import->totalRows ?? 0,
            'valid' => $import->validRows ?? 0,
            'errors' => $import->errors ?? [],
        ];
    }
}
