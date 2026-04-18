<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\Evaluasi;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class EvaluasiController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('access-admin-panel');
        $user = auth()->user();
        $isFacultyAdmin = $user?->hasRole('faculty_admin');
        $facultyId = $isFacultyAdmin ? $user?->fakultas_id : null;

        $evaluations = Evaluasi::with(['mahasiswa', 'kelompok', 'evaluator', 'item'])
            ->orderByDesc('evaluated_at')
            ->when($facultyId, fn ($q) => $q->whereHas('mahasiswa', fn ($m) => $m->where('fakultas_id', $facultyId)))
            ->paginate(20);

        // Map to frontend-expected property names
        $evaluations->through(function ($eval) {
            return [
                'id' => $eval->id,
                'student_name' => $eval->mahasiswa?->nama ?? '-',
                'group_name' => $eval->kelompok?->nama_kelompok ?? '-',
                'evaluator_name' => $eval->evaluator?->name ?? '-',
                'evaluator_type' => $eval->evaluator_type,
                'total_score' => $eval->total_score,
                'grade' => $eval->grade,
                'evaluated_at' => $eval->evaluated_at,
                'notes' => $eval->notes,
                'items' => $eval->item->map(fn ($item) => [
                    'criterion' => $item->criterion,
                    'score' => $item->score,
                    'weight' => $item->weight,
                ]),
            ];
        });

        return Inertia::render('Admin/Academic/Evaluations/Index', [
            'evaluations' => $evaluations,
        ]);
    }
}
