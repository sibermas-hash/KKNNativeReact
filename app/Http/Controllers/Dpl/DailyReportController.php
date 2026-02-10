<?php

namespace App\Http\Controllers\Dpl;

use App\Http\Controllers\Controller;
use App\Models\DailyReport;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DailyReportController extends Controller
{
    public function index(Request $request): Response
    {
        $lecturer = auth()->user()->lecturer;
        $groupIds = $lecturer
            ? $lecturer->groups()->pluck('id')
            : collect();

        $reports = DailyReport::whereIn('group_id', $groupIds)
            ->with('student', 'group')
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->orderByDesc('date')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Dpl/DailyReports/Index', [
            'reports' => $reports,
            'filters' => $request->only('status'),
        ]);
    }

    public function show(DailyReport $dailyReport): Response
    {
        $dailyReport->load('student', 'group.location', 'files', 'reviewer');

        return Inertia::render('Dpl/DailyReports/Show', [
            'report' => $dailyReport,
        ]);
    }

    public function approve(DailyReport $dailyReport): RedirectResponse
    {
        $dailyReport->update([
            'status' => 'approved',
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        // Notify student
        $dailyReport->student->user->notify(new \App\Notifications\KknActivityNotification([
            'type' => 'success',
            'title' => 'Laporan Harian Disetujui',
            'message' => "Laporan harian Anda tanggal " . $dailyReport->date->format('d/m/Y') . " telah disetujui.",
            'icon' => 'check-circle',
            'url' => route('student.daily-reports.index'),
        ]));

        return redirect()->back()->with('success', 'Laporan harian disetujui.');
    }

    public function revision(Request $request, DailyReport $dailyReport): RedirectResponse
    {
        $validated = $request->validate([
            'revision_notes' => ['required', 'string', 'max:1000'],
        ]);

        $dailyReport->update([
            'status' => 'revision',
            'review_notes' => $validated['revision_notes'],
        ]);

        // Notify student
        $dailyReport->student->user->notify(new \App\Notifications\KknActivityNotification([
            'type' => 'warning',
            'title' => 'Revisi Laporan Harian',
            'message' => "Laporan harian Anda tanggal " . $dailyReport->date->format('d/m/Y') . " memerlukan revisi.",
            'icon' => 'exclamation-circle',
            'url' => route('student.daily-reports.index'),
        ]));

        return redirect()->back()->with('success', 'Laporan dikembalikan untuk revisi.');
    }
}
