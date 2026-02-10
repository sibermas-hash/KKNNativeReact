<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\DailyReport;
use App\Models\DailyReportFile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class DailyReportController extends Controller
{
    public function index(): Response
    {
        $student = auth()->user()->student;

        $reports = $student
            ? DailyReport::where('student_id', $student->id)
                ->with('group', 'files')
                ->orderByDesc('date')
                ->paginate(10)
            : collect();

        return Inertia::render('Student/DailyReports/Index', [
            'reports' => $reports,
        ]);
    }

    public function create(): Response
    {
        $student = auth()->user()->student;
        $registration = $student?->registrations()->where('status', 'approved')->with('group')->first();

        return Inertia::render('Student/DailyReports/Create', [
            'group' => $registration?->group,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $student = auth()->user()->student;
        $registration = $student->registrations()->where('status', 'approved')->first();
        abort_if(!$registration || !$registration->group_id, 403, 'Anda belum ditempatkan di kelompok.');

        $validated = $request->validate([
            'date' => ['required', 'date'],
            'title' => ['required', 'string', 'max:200'],
            'activity' => ['required', 'string'],
            'reflection' => ['nullable', 'string'],
            'output' => ['nullable', 'string'],
            'files.*' => ['nullable', 'file', 'max:5120'],
        ]);

        $report = DailyReport::create([
            'student_id' => $student->id,
            'group_id' => $registration->group_id,
            'date' => $validated['date'],
            'title' => $validated['title'],
            'activity' => $validated['activity'],
            'reflection' => $validated['reflection'] ?? null,
            'output' => $validated['output'] ?? null,
            'status' => 'submitted',
        ]);

        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $path = $file->store('daily-reports', 'public');
                DailyReportFile::create([
                    'daily_report_id' => $report->id,
                    'file_path' => $path,
                    'file_name' => $file->getClientOriginalName(),
                ]);
            }
        }

        // Notify DPL
        $dpl = $report->group->lecturer->user;
        if ($dpl) {
            $dpl->notify(new \App\Notifications\KknActivityNotification([
                'type' => 'info',
                'title' => 'Laporan Harian Baru',
                'message' => "{$student->user->name} telah mengirim laporan harian untuk tanggal " . $report->date->format('d/m/Y'),
                'icon' => 'document-text',
                'url' => route('dpl.daily-reports.index', ['status' => 'submitted']),
            ]));
        }

        return redirect()->route('student.daily-reports.index')
            ->with('success', 'Laporan harian berhasil dikirim.');
    }

    public function edit(DailyReport $dailyReport): Response
    {
        $student = auth()->user()->student;
        abort_if($dailyReport->student_id !== $student->id, 403);
        $dailyReport->load('files');

        return Inertia::render('Student/DailyReports/Edit', [
            'report' => $dailyReport,
        ]);
    }

    public function update(Request $request, DailyReport $dailyReport): RedirectResponse
    {
        $student = auth()->user()->student;
        abort_if($dailyReport->student_id !== $student->id, 403);

        $validated = $request->validate([
            'date' => ['required', 'date'],
            'title' => ['required', 'string', 'max:200'],
            'activity' => ['required', 'string'],
            'reflection' => ['nullable', 'string'],
            'output' => ['nullable', 'string'],
        ]);

        $dailyReport->update([
            ...$validated,
            'status' => 'submitted',
        ]);

        return redirect()->route('student.daily-reports.index')
            ->with('success', 'Laporan harian berhasil diperbarui.');
    }

    public function destroy(DailyReport $dailyReport): RedirectResponse
    {
        $student = auth()->user()->student;
        abort_if($dailyReport->student_id !== $student->id, 403);

        foreach ($dailyReport->files as $file) {
            Storage::disk('public')->delete($file->file_path);
        }

        $dailyReport->delete();

        return redirect()->route('student.daily-reports.index')
            ->with('success', 'Laporan harian berhasil dihapus.');
    }
}
