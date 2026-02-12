<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\KKN\Evaluasi;
use Inertia\Inertia;
use Inertia\Response;

class EvaluationController extends Controller
{
    public function index(): Response
    {
        $mahasiswa = auth()->user()->mahasiswa;

        $evaluations = $mahasiswa
            ? Evaluasi::where('mahasiswa_id', $mahasiswa->id)
                ->with('itemEvaluasi', 'kelompok')
                ->get()
            : collect();

        return Inertia::render('Student/Evaluations/Index', [
            'evaluations' => $evaluations,
        ]);
    }
}
