<?php

namespace App\Http\Controllers\Dpl;

use App\Http\Controllers\Controller;
use App\Models\KKN\LaporanAkhir;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinalReportController extends Controller
{
    public function index(Request $request): Response
    {
        $dosen = auth()->user()->dosen;
        abort_if(!$dosen, 403, 'Data dosen tidak ditemukan.');
        $groupIds = $dosen->kelompokKkn()->pluck('id');

        $reports = LaporanAkhir::whereIn('kelompok_id', $groupIds)
            ->with(['mahasiswa', 'kelompok'])
            ->when($request->input('status'), fn($q, $s) => $q->where('status', $s))
            ->orderByDesc('submitted_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Dpl/FinalReports/Index', [
            'reports' => $reports,
            'filters' => $request->only('status'),
        ]);
    }

    public function show(LaporanAkhir $report): Response
    {
        $dosen = auth()->user()->dosen;
        abort_if(!$dosen || $report->kelompok->dpl_id !== $dosen->id, 403);

        $report->load(['mahasiswa', 'kelompok.lokasi']);

        return Inertia::render('Dpl/FinalReports/Show', [
            'report' => $report,
        ]);
    }

    public function approve(LaporanAkhir $report): RedirectResponse
    {
        $dosen = auth()->user()->dosen;
        abort_if(!$dosen || $report->kelompok->dpl_id !== $dosen->id, 403);

        $report->update([
            'status' => 'approved',
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        // Notify student
        if ($report->mahasiswa?->user) {
            $report->mahasiswa->user->notify(new \App\Notifications\KknActivityNotification([
                'type' => 'success',
                'title' => 'Laporan Akhir Disetujui',
                'message' => "Laporan akhir Anda (" . $report->title . ") telah disetujui oleh DPL.",
                'icon' => 'check-circle',
                'url' => route('student.dashboard'),
            ]));
        }

        return redirect()->back()->with('success', 'Laporan akhir berhasil disetujui.');
    }

    public function revision(Request $request, LaporanAkhir $report): RedirectResponse
    {
        $dosen = auth()->user()->dosen;
        abort_if(!$dosen || $report->kelompok->dpl_id !== $dosen->id, 403);

        $validated = $request->validate([
            'notes' => ['required', 'string', 'max:1000'],
        ]);

        $report->update([
            'status' => 'revision',
            'review_notes' => $validated['notes'],
        ]);

        // Notify student
        if ($report->mahasiswa?->user) {
            $report->mahasiswa->user->notify(new \App\Notifications\KknActivityNotification([
                'type' => 'warning',
                'title' => 'Revisi Laporan Akhir',
                'message' => "Laporan akhir Anda memerlukan perbaikan. Catatan: " . $validated['notes'],
                'icon' => 'exclamation-triangle',
                'url' => route('student.dashboard'),
            ]));
        }

        return redirect()->back()->with('success', 'Laporan akhir dikembalikan untuk revisi.');
    }
}
