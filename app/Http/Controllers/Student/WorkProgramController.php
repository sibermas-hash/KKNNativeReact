<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\WorkProgram;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkProgramController extends Controller
{
    public function index(): Response
    {
        $student = auth()->user()->student;
        $registration = $student?->registrations()->where('status', 'approved')->first();

        $workPrograms = $registration && $registration->group_id
            ? WorkProgram::where('group_id', $registration->group_id)
                ->orderByDesc('created_at')
                ->get()
            : collect();

        return Inertia::render('Student/WorkPrograms/Index', [
            'workPrograms' => $workPrograms,
            'canCreate' => $registration && $registration->group_id,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Student/WorkPrograms/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $student = auth()->user()->student;
        $registration = $student->registrations()->where('status', 'approved')->first();
        abort_if(!$registration || !$registration->group_id, 403);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'objectives' => ['nullable', 'string'],
            'target_participants' => ['nullable', 'integer', 'min:1'],
            'budget' => ['required', 'numeric', 'min:0'],
        ]);

        WorkProgram::create([
            'group_id' => $registration->group_id,
            ...$validated,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        return redirect()->route('student.work-programs.index')
            ->with('success', 'Program kerja berhasil diajukan.');
    }
}
