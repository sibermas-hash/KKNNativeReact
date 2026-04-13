<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\LaporanAkhir;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class LaporanAkhirController extends Controller
{
    use \App\Traits\HandlesPagination;

    public function index(Request $request): Response
    {
        Gate::authorize('view-reports');
        $status = $request->input('status');

        $user = auth()->user();
        $isFacultyAdmin = $user?->hasRole('faculty_admin');
        $facultyId = $isFacultyAdmin ? $user?->faculty_id : null;

        $reports = LaporanAkhir::with(['mahasiswa', 'kelompok'])
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($facultyId, fn ($q) => $q->whereHas('mahasiswa', fn ($m) => $m->where('faculty_id', $facultyId)))
            ->orderByDesc('submitted_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Monitoring/FinalReports/Index', [
            'reports' => Inertia::defer(fn () => $this->formatPaginator($reports)),
            'filters' => $request->only('status'),
        ]);
    }

    public function show(LaporanAkhir $report): Response
    {
        Gate::authorize('view-reports');
        $report->load(['mahasiswa.user', 'kelompok.dpl.user', 'reviewer']);

        return Inertia::render('Admin/Monitoring/FinalReports/Show', [
            'report' => $report,
        ]);
    }

    public function updateStatus(Request $request, LaporanAkhir $report)
    {
        Gate::authorize('manage-grades'); // Reuse permission for grading/approval

        $validated = $request->validate([
            'status' => ['required', 'in:disetujui,revisi'],
            'review_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $report->update([
            'status' => $validated['status'],
            'review_notes' => $validated['review_notes'],
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        return redirect()->route('admin.laporan.akhir.index')
            ->with('success', 'Status laporan berhasil diperbarui menjadi: '.strtoupper($validated['status']));
    }
}
