<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\FinalReport;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinalReportController extends Controller
{
    public function create(): Response
    {
        $student = auth()->user()->student;
        $registration = $student?->registrations()->where('status', 'approved')->first();
        $existingReport = $student
            ? FinalReport::where('student_id', $student->id)->latest()->first()
            : null;

        return Inertia::render('Student/FinalReport/Create', [
            'group' => $registration?->group,
            'existingReport' => $existingReport,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $student = auth()->user()->student;
        $registration = $student->registrations()->where('status', 'approved')->first();
        abort_if(!$registration || !$registration->group_id, 403);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:300'],
            'abstract' => ['nullable', 'string'],
            'file' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:20480'],
        ]);

        $file = $request->file('file');
        $path = $file->store('final-reports', 'public');

        FinalReport::updateOrCreate(
            ['student_id' => $student->id, 'group_id' => $registration->group_id],
            [
                'title' => $validated['title'],
                'abstract' => $validated['abstract'] ?? null,
                'file_path' => $path,
                'file_name' => $file->getClientOriginalName(),
                'status' => 'submitted',
                'submitted_at' => now(),
            ],
        );

        return redirect()->route('student.dashboard')
            ->with('success', 'Laporan akhir berhasil dikirim.');
    }
}
