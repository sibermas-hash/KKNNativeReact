<?php

namespace App\Http\Controllers\Dpl;

use App\Http\Controllers\Controller;
use App\Imports\EvaluationImport;
use App\Models\KKN\Evaluasi;
use App\Models\KKN\ItemEvaluasi;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\Mahasiswa;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;

class EvaluationController extends Controller
{
    public function index(): Response
    {
        $dosen = auth()->user()->dosen;
        $groupIds = $dosen ? $dosen->kelompokKkn()->pluck('id') : collect();

        $evaluations = Evaluasi::whereIn('kelompok_id', $groupIds)
            ->with(['mahasiswa', 'kelompok', 'itemEvaluasi'])
            ->orderByDesc('evaluated_at')
            ->get();

        $groups = KelompokKkn::whereIn('id', $groupIds)
            ->with(['registrations' => fn($q) => $q->where('status', 'approved')->with('mahasiswa')])
            ->get();

        return Inertia::render('Dpl/Evaluations/Index', [
            'evaluations' => $evaluations,
            'groups' => $groups,
        ]);
    }

    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'group_id' => ['required', 'exists:kelompok_kkn,id'],
            'file' => ['required', 'file', 'mimes:xlsx,xls'],
        ]);

        Excel::import(new EvaluationImport($request->group_id, auth()->id()), $request->file('file'));

        return redirect()->back()->with('success', 'Data penilaian berhasil diimport.');
    }

    public function create(Request $request): Response
    {
        $dosen = auth()->user()->dosen;
        $groups = $dosen
            ? KelompokKkn::where('dpl_id', $dosen->id)->with('registrations.mahasiswa')->get()
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

        foreach ($validated['items'] as $item) {
            ItemEvaluasi::create([
                'evaluasi_id' => $evaluation->id,
                'criterion' => $item['criterion'],
                'score' => $item['score'],
                'weight' => $item['weight'],
            ]);

            $totalScore += $item['score'] * ($item['weight'] / 100);
            $totalWeight += $item['weight'];
        }

        $finalScore = $totalWeight > 0 ? round($totalScore, 2) : 0;
        $grade = match (true) {
            $finalScore >= 85 => 'A',
            $finalScore >= 80 => 'A-',
            $finalScore >= 75 => 'B+',
            $finalScore >= 70 => 'B',
            $finalScore >= 65 => 'B-',
            $finalScore >= 60 => 'C+',
            $finalScore >= 55 => 'C',
            default => 'D',
        };

        $evaluation->update([
            'total_score' => $finalScore,
            'grade' => $grade,
        ]);

        return redirect()->route('dpl.evaluations.index')
            ->with('success', 'Evaluasi berhasil disimpan.');
    }
}
