<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Evaluation;
use Inertia\Inertia;
use Inertia\Response;

class EvaluationController extends Controller
{
    public function index(): Response
    {
        $student = auth()->user()->student;

        $evaluations = $student
            ? Evaluation::where('student_id', $student->id)
                ->with('items', 'group')
                ->get()
            : collect();

        return Inertia::render('Student/Evaluations/Index', [
            'evaluations' => $evaluations,
        ]);
    }
}
