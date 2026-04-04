<?php

namespace App\Http\Controllers\Dpl;

use App\Http\Controllers\Controller;
use App\Models\KKN\Evaluasi;
use App\Models\KKN\ItemEvaluasi;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\KonfigurasiPenilaian;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaKkn;
use App\Services\GradingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Str;

class EvaluationController extends Controller
{
    public function __construct(
        protected GradingService $gradingService
    ) {}

    private function checkGradingPeriod(KelompokKkn $group)
    {
        $period = $group->periode;
        if ($period && $period->grading_start && $period->grading_end) {
            $now = now()->startOfDay();
            if ($now->lt($period->grading_start) || $now->gt($period->grading_end)) {
                return false;
            }
        }
        return true;
    }

    /**
     * @return array{final_report: float, execution: float, article: float}
     */
    private function dplWeights(): array
    {
        KonfigurasiPenilaian::ensureDefaults();

        $weights = KonfigurasiPenilaian::query()
            ->whereIn('config_key', [
                'weight_dpl_report',
                'weight_dpl_execution',
                'weight_dpl_article',
            ])
            ->pluck('percentage', 'config_key');

        return [
            'final_report' => (float) ($weights['weight_dpl_report'] ?? 30),
            'execution' => (float) ($weights['weight_dpl_execution'] ?? 40),
            'article' => (float) ($weights['weight_dpl_article'] ?? 30),
        ];
    }

    private function calculateWeightedDplScore(float $reportScore, float $executionScore, float $articleScore): float
    {
        $weights = $this->dplWeights();

        return round(
            ($reportScore * ($weights['final_report'] / 100)) +
            ($executionScore * ($weights['execution'] / 100)) +
            ($articleScore * ($weights['article'] / 100)),
            2
        );
    }

    private function studentBelongsToGroup(int $studentId, int $groupId): bool
    {
        return PesertaKkn::query()
            ->where('mahasiswa_id', $studentId)
            ->where('kelompok_id', $groupId)
            ->where('status', 'approved')
            ->exists();
    }

    private function ensureStudentBelongsToGroup(int $studentId, int $groupId): void
    {
        if (!$this->studentBelongsToGroup($studentId, $groupId)) {
            throw ValidationException::withMessages([
                'student_id' => 'Mahasiswa tidak terdaftar pada kelompok yang dipilih.',
            ]);
        }
    }

    /**
     * Verify the logged-in DPL is assigned to the given group.
     */
    private function authorizeGroupOwnership(int $groupId): \App\Models\KKN\Dosen
    {
        $dosen = auth()->user()->dosen;
        abort_if(!$dosen, 403, 'Data dosen tidak ditemukan.');

        $groupIds = $dosen->kelompokKkn()->pluck('kelompok_kkn.id');
        abort_if(!$groupIds->contains($groupId), 403, 'Anda tidak memiliki akses ke kelompok ini.');

        return $dosen;
    }

    public function index(): Response
    {
        $dosen = auth()->user()->dosen;
        abort_if(!$dosen, 403, 'Data dosen tidak ditemukan.');
        $groupIds = $dosen->kelompokKkn()->pluck('id');

        $evaluations = Evaluasi::whereIn('kelompok_id', $groupIds)
            ->with(['mahasiswa', 'kelompok', 'item'])
            ->orderByDesc('evaluated_at')
            ->get();

        $groups = KelompokKkn::whereIn('id', $groupIds)
            ->with(['peserta' => fn($q) => $q->where('status', 'approved')->with('mahasiswa'), 'periode'])
            ->get();

        return Inertia::render('Dpl/Evaluations/Index', [
            'evaluations' => $evaluations->map(fn (Evaluasi $evaluation) => [
                'id' => $evaluation->id,
                'student' => [
                    'name' => $evaluation->mahasiswa?->nama ?? 'Mahasiswa tidak ditemukan',
                    'nim' => $evaluation->mahasiswa?->nim ?? '-',
                ],
                'group' => [
                    'name' => $evaluation->kelompok?->nama_kelompok ?? $evaluation->kelompok?->code ?? '-',
                ],
                'total_score' => $evaluation->total_score,
                'grade' => $evaluation->grade,
            ])->values(),
            'groups' => $groups->map(fn (KelompokKkn $group) => [
                'id' => $group->id,
                'name' => $group->nama_kelompok,
                'period_name' => $group->periode?->name ?? '-',
                'students' => $group->peserta->map(fn ($registration) => [
                    'id' => $registration->mahasiswa?->id,
                    'nim' => $registration->mahasiswa?->nim ?? '-',
                    'name' => $registration->mahasiswa?->nama ?? 'Mahasiswa tidak ditemukan',
                ])->filter(fn ($student) => $student['id'] !== null)->values(),
            ])->values(),
            'dplWeights' => $this->dplWeights(),
        ]);
    }

    public function validateImport(Request $request): Response|RedirectResponse
    {
        $request->validate([
            'group_id' => ['required', 'exists:kelompok_kkn,id'],
            'file' => ['required', 'file', 'mimes:xlsx,xls'],
        ]);

        $this->authorizeGroupOwnership($request->group_id);

        $group = KelompokKkn::with(['peserta.mahasiswa', 'periode'])->find($request->group_id);

        if (!$this->checkGradingPeriod($group)) {
            return back()->with('error', 'Masa penilaian KKN untuk periode ini belum dibuka atau sudah berakhir.');
        }

        $rows = Excel::toCollection(new class implements \Maatwebsite\Excel\Concerns\ToCollection {
            public function collection(\Illuminate\Support\Collection $rows) {}
        }, $request->file('file'))->first();
        
        // --- SMART COLUMN DETECTION ---
        $headerRowIndex = -1;
        $colMapping = [
            'nim' => -1,
            'name' => -1,
            'final_report' => -1,
            'execution' => -1,
            'article' => -1,
        ];

        // Search for header row (max 20 rows deep)
        foreach ($rows->take(20) as $index => $row) {
            foreach ($row as $colIndex => $content) {
                $clean = Str::lower(trim($content));
                if (Str::contains($clean, ['nim', 'nomor induk'])) $colMapping['nim'] = $colIndex;
                if (Str::contains($clean, ['nama', 'name', 'mahasiswa'])) $colMapping['name'] = $colIndex;
                if (Str::contains($clean, ['laporan akhir', 'final report', 'laporan'])) $colMapping['final_report'] = $colIndex;
                if (Str::contains($clean, ['pelaksanaan', 'execution', 'implementasi', 'program'])) $colMapping['execution'] = $colIndex;
                if (Str::contains($clean, ['artikel', 'article', 'jurnal'])) $colMapping['article'] = $colIndex;
            }

            if (
                $colMapping['nim'] !== -1
                && $colMapping['final_report'] !== -1
                && $colMapping['execution'] !== -1
                && $colMapping['article'] !== -1
            ) {
                $headerRowIndex = $index;
                break;
            }
        }

        if (
            $headerRowIndex === -1
            || $colMapping['nim'] === -1
            || $colMapping['final_report'] === -1
            || $colMapping['execution'] === -1
            || $colMapping['article'] === -1
        ) {
            return back()->with('error', 'Format file tidak dikenali. Pastikan ada kolom NIM, Laporan Akhir, Pelaksanaan, dan Artikel.');
        }

        $dataRows = $rows->slice($headerRowIndex + 1);
        $preview = [];

        foreach ($dataRows as $row) {
            $nim = trim($row[$colMapping['nim']] ?? '');
            if (!$nim) continue;

            $mahasiswa = Mahasiswa::where('nim', $nim)->first();
            $isMember = $group->peserta->pluck('mahasiswa_id')->contains($mahasiswa?->id);

            $preview[] = [
                'nim' => $nim,
                'name' => $row[$colMapping['name']] ?? 'Unknown',
                'final_report_score' => $row[$colMapping['final_report']] ?? 0,
                'execution_score' => $row[$colMapping['execution']] ?? 0,
                'article_score' => $row[$colMapping['article']] ?? 0,
                'status' => $mahasiswa ? ($isMember ? 'READY' : 'NOT_IN_GROUP') : 'NOT_FOUND',
                'id' => $mahasiswa?->id
            ];
        }

        return Inertia::render('Dpl/Evaluations/ImportPreview', [
            'preview' => $preview,
            'group' => [
                'id' => $group->id,
                'name' => $group->nama_kelompok,
                'period_name' => $group->periode?->name ?? '-',
            ],
            'dplWeights' => $this->dplWeights(),
            'mapping' => $colMapping // Send mapping for transparency
        ]);
    }

    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'group_id' => ['required', 'exists:kelompok_kkn,id'],
            'data' => ['required', 'array'],
            'data.*.final_report_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'data.*.execution_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'data.*.article_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $this->authorizeGroupOwnership($request->group_id);

        $group = KelompokKkn::with('periode')->find($request->group_id);
        if (!$this->checkGradingPeriod($group)) {
            return back()->with('error', 'Masa penilaian KKN untuk periode ini belum dibuka atau sudah berakhir.');
        }

        $lecturerId = auth()->id();
        $groupId = $request->group_id;
        $weights = $this->dplWeights();

        DB::transaction(function () use ($request, $lecturerId, $groupId, $weights) {
            foreach ($request->data as $item) {
                if ($item['status'] !== 'READY') continue;

                // VULN-005 Fix: Verify student is actually a member of this group
                $isMember = $this->studentBelongsToGroup((int) $item['id'], (int) $groupId);
                
                if (!$isMember) {
                    \Illuminate\Support\Facades\Log::warning("DPL attempted to grade non-member student", [
                        'student_id' => $item['id'],
                        'group_id' => $groupId,
                        'dpl_id' => $lecturerId,
                    ]);
                    continue; // Skip non-members
                }

                $eval = Evaluasi::updateOrCreate([
                    'mahasiswa_id' => $item['id'],
                    'kelompok_id' => $groupId,
                    'evaluator_id' => $lecturerId,
                    'evaluator_type' => 'dpl'
                ], [
                    'evaluated_at' => now(),
                ]);

                $eval->item()->delete();

                ItemEvaluasi::create([
                    'evaluasi_id' => $eval->id,
                    'criterion' => 'Laporan Akhir',
                    'score' => $item['final_report_score'],
                    'weight' => $weights['final_report'],
                ]);
                ItemEvaluasi::create([
                    'evaluasi_id' => $eval->id,
                    'criterion' => 'Pelaksanaan Program',
                    'score' => $item['execution_score'],
                    'weight' => $weights['execution'],
                ]);
                ItemEvaluasi::create([
                    'evaluasi_id' => $eval->id,
                    'criterion' => 'Artikel Ilmiah',
                    'score' => $item['article_score'],
                    'weight' => $weights['article'],
                ]);

                $total = $this->calculateWeightedDplScore(
                    (float) $item['final_report_score'],
                    (float) $item['execution_score'],
                    (float) $item['article_score']
                );
                $eval->update(['total_score' => $total, 'grade' => $this->calculateGrade($total)]);

                // Sync to NilaiKkn (Centralized)
                $mahasiswa = Mahasiswa::find($item['id']);
                if ($mahasiswa) {
                    $this->gradingService->submitDPLScores(
                        $mahasiswa->user_id,
                        $groupId,
                        (float) $item['final_report_score'],
                        (float) $item['execution_score'],
                        (float) $item['article_score'],
                        $lecturerId
                    );
                }
            }
        });

        return redirect()->route('dpl.evaluations.index')->with('success', 'Import evaluasi berhasil diselesaikan.');
    }

    private function calculateGrade($score)
    {
        if ($score >= 85) return 'A';
        if ($score >= 80) return 'A-';
        if ($score >= 75) return 'B+';
        if ($score >= 70) return 'B';
        if ($score >= 65) return 'B-';
        if ($score >= 60) return 'C+';
        if ($score >= 55) return 'C';
        return 'D';
    }

    public function create(Request $request): RedirectResponse
    {
        return redirect()
            ->route('dpl.evaluations.index', array_filter([
                'group_id' => $request->input('group_id'),
                'student_id' => $request->input('student_id'),
            ]))
            ->with('info', 'Form input manual tersedia di halaman evaluasi utama.');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'student_id' => ['required', 'exists:mahasiswa,id'],
            'group_id' => ['required', 'exists:kelompok_kkn,id'],
            'evaluator_type' => ['required', 'in:dpl'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'size:3'],
            'items.*.criterion' => ['required', 'string'],
            'items.*.score' => ['required', 'numeric', 'min:0', 'max:100'],
            'items.*.weight' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $this->authorizeGroupOwnership($validated['group_id']);

        $group = KelompokKkn::with('periode')->find($validated['group_id']);
        if (!$this->checkGradingPeriod($group)) {
            return back()->with('error', 'Masa penilaian KKN untuk periode ini belum dibuka atau sudah berakhir.');
        }

        $this->ensureStudentBelongsToGroup((int) $validated['student_id'], (int) $validated['group_id']);

        $evaluation = Evaluasi::create([
            'mahasiswa_id' => $validated['student_id'],
            'kelompok_id' => $validated['group_id'],
            'evaluator_id' => auth()->id(),
            'evaluator_type' => $validated['evaluator_type'],
            'notes' => $validated['notes'] ?? null,
            'evaluated_at' => now(),
        ]);

        $totalScore = 0;
        $totalWeight = 0;
        $reportScore = 0;
        $executionScore = 0;
        $articleScore = 0;

        foreach ($validated['items'] as $item) {
            ItemEvaluasi::create([
                'evaluasi_id' => $evaluation->id,
                'criterion' => $item['criterion'],
                'score' => $item['score'],
                'weight' => $item['weight'],
            ]);

            if (stripos($item['criterion'], 'laporan') !== false) $reportScore = (float) $item['score'];
            if (stripos($item['criterion'], 'pelaksanaan') !== false) $executionScore = (float) $item['score'];
            if (stripos($item['criterion'], 'artikel') !== false) $articleScore = (float) $item['score'];

            $totalScore += $item['score'] * ($item['weight'] / 100);
            $totalWeight += $item['weight'];
        }

        $finalScore = $totalWeight > 0 ? round($totalScore, 2) : 0;
        $grade = $this->calculateGrade($finalScore);

        $evaluation->update([
            'total_score' => $finalScore,
            'grade' => $grade,
        ]);

        // Sync to NilaiKkn (Centralized)
        $mahasiswa = Mahasiswa::find($validated['student_id']);
        if ($mahasiswa && $validated['evaluator_type'] === 'dpl') {
            $this->gradingService->submitDPLScores(
                $mahasiswa->user_id,
                $validated['group_id'],
                $reportScore,
                $executionScore,
                $articleScore,
                auth()->id()
            );
        }

        return redirect()->route('dpl.evaluations.index')
            ->with('success', 'Evaluasi berhasil disimpan.');
    }
}
