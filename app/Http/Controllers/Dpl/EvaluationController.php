<?php

namespace App\Http\Controllers\Dpl;

use App\Http\Controllers\Controller;
use App\Models\KKN\Evaluasi;
use App\Models\KKN\ItemEvaluasi;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use App\Services\GradingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
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
            'evaluations' => $evaluations,
            'groups' => $groups,
        ]);
    }

    public function validateImport(Request $request): Response|RedirectResponse
    {
        $request->validate([
            'group_id' => ['required', 'exists:kelompok_kkn,id'],
            'file' => ['required', 'file', 'mimes:xlsx,xls'],
        ]);

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
            'discipline' => -1,
            'attitude' => -1
        ];

        // Search for header row (max 20 rows deep)
        foreach ($rows->take(20) as $index => $row) {
            foreach ($row as $colIndex => $content) {
                $clean = Str::lower(trim($content));
                if (Str::contains($clean, ['nim', 'nomor induk'])) $colMapping['nim'] = $colIndex;
                if (Str::contains($clean, ['nama', 'name', 'mahasiswa'])) $colMapping['name'] = $colIndex;
                if (Str::contains($clean, ['disiplin', 'kedisiplinan', 'discipline'])) $colMapping['discipline'] = $colIndex;
                if (Str::contains($clean, ['sikap', 'attitude', 'etika'])) $colMapping['attitude'] = $colIndex;
            }

            // If we found at least NIM and one score, we assume this is the header row
            if ($colMapping['nim'] !== -1 && ($colMapping['discipline'] !== -1 || $colMapping['attitude'] !== -1)) {
                $headerRowIndex = $index;
                break;
            }
        }

        if ($headerRowIndex === -1 || $colMapping['nim'] === -1) {
            return back()->with('error', 'Format file tidak dikenali. Pastikan ada kolom NIM dan Nilai (Disiplin/Sikap).');
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
                'discipline' => $colMapping['discipline'] !== -1 ? ($row[$colMapping['discipline']] ?? 0) : 0,
                'attitude' => $colMapping['attitude'] !== -1 ? ($row[$colMapping['attitude']] ?? 0) : 0,
                'status' => $mahasiswa ? ($isMember ? 'READY' : 'NOT_IN_GROUP') : 'NOT_FOUND',
                'id' => $mahasiswa?->id
            ];
        }

        return Inertia::render('Dpl/Evaluations/ImportPreview', [
            'preview' => $preview,
            'group' => $group,
            'mapping' => $colMapping // Send mapping for transparency
        ]);
    }

    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'group_id' => ['required', 'exists:kelompok_kkn,id'],
            'data' => ['required', 'array'],
        ]);

        $group = KelompokKkn::with('periode')->find($request->group_id);
        if (!$this->checkGradingPeriod($group)) {
            return back()->with('error', 'Masa penilaian KKN untuk periode ini belum dibuka atau sudah berakhir.');
        }

        $lecturerId = auth()->id();
        $groupId = $request->group_id;

        DB::transaction(function () use ($request, $lecturerId, $groupId) {
            foreach ($request->data as $item) {
                if ($item['status'] !== 'READY') continue;

                $eval = Evaluasi::updateOrCreate([
                    'mahasiswa_id' => $item['id'],
                    'kelompok_id' => $groupId,
                    'evaluator_id' => $lecturerId,
                    'evaluator_type' => 'dpl'
                ], [
                    'evaluated_at' => now(),
                ]);

                $eval->item()->delete();

                ItemEvaluasi::create(['evaluasi_id' => $eval->id, 'criterion' => 'Kedisiplinan', 'score' => $item['discipline'], 'weight' => 50]);
                ItemEvaluasi::create(['evaluasi_id' => $eval->id, 'criterion' => 'Sikap', 'score' => $item['attitude'], 'weight' => 50]);

                $total = ($item['discipline'] * 0.5) + ($item['attitude'] * 0.5);
                $eval->update(['total_score' => $total, 'grade' => $this->calculateGrade($total)]);

                // Sync to NilaiKkn (Centralized)
                $mahasiswa = Mahasiswa::find($item['id']);
                if ($mahasiswa) {
                    $this->gradingService->submitVillageHeadScores(
                        $mahasiswa->user_id,
                        $groupId,
                        $item['discipline'],
                        $item['attitude'],
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

    public function create(Request $request): Response
    {
        $dosen = auth()->user()->dosen;
        $groups = $dosen
            ? KelompokKkn::where('dpl_id', $dosen->id)->with('peserta.mahasiswa')->get()
            : collect();

        return Inertia::render('Dpl/Evaluations/Form', [
            'groups' => $groups,
            'selectedGroupId' => $request->input('group_id'),
            'selectedStudentId' => $request->input('student_id'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'student_id' => ['required', 'exists:mahasiswa,id'],
            'group_id' => ['required', 'exists:kelompok_kkn,id'],
            'evaluator_type' => ['required', 'in:dpl,peer,community'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.criterion' => ['required', 'string'],
            'items.*.score' => ['required', 'numeric', 'min:0', 'max:100'],
            'items.*.weight' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $group = KelompokKkn::with('periode')->find($validated['group_id']);
        if (!$this->checkGradingPeriod($group)) {
            return back()->with('error', 'Masa penilaian KKN untuk periode ini belum dibuka atau sudah berakhir.');
        }

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
        $discipline = 0;
        $attitude = 0;

        foreach ($validated['items'] as $item) {
            ItemEvaluasi::create([
                'evaluasi_id' => $evaluation->id,
                'criterion' => $item['criterion'],
                'score' => $item['score'],
                'weight' => $item['weight'],
            ]);

            if (stripos($item['criterion'], 'disiplin') !== false) $discipline = $item['score'];
            if (stripos($item['criterion'], 'sikap') !== false) $attitude = $item['score'];

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
            $this->gradingService->submitVillageHeadScores(
                $mahasiswa->user_id,
                $validated['group_id'],
                $discipline,
                $attitude,
                auth()->id()
            );
        }

        return redirect()->route('dpl.evaluations.index')
            ->with('success', 'Evaluasi berhasil disimpan.');
    }
}
