<?php

namespace App\Http\Controllers\Dpl;

use App\Http\Controllers\Controller;
use App\Models\KKN\KegiatanKkn;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DailyReportController extends Controller
{
    public function index(Request $request): Response
    {
        $dosen = auth()->user()->dosen;
        abort_if(!$dosen, 403, 'Data dosen tidak ditemukan.');
        $groupIds = $dosen->kelompokKkn()->pluck('id');

        $kegiatan = KegiatanKkn::whereIn('kelompok_id', $groupIds)
            ->with(['mahasiswa', 'kelompok'])
            ->when($request->input('status'), fn($q, $s) => $q->where('status', $s))
            ->orderByDesc('date')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Dpl/DailyReports/Index', [
            'reports' => $kegiatan,
            'filters' => $request->only('status'),
        ]);
    }

    public function show(KegiatanKkn $dailyReport): Response
    {
        $dosen = auth()->user()->dosen;
        abort_if(!$dosen, 403, 'Data dosen tidak ditemukan.');
        $groupIds = $dosen->kelompokKkn()->pluck('id');
        abort_if(!$groupIds->contains($dailyReport->kelompok_id), 403, 'Anda tidak memiliki akses ke laporan ini.');

        $dailyReport->load(['mahasiswa', 'kelompok.lokasi', 'fileKegiatan', 'reviewer']);

        return Inertia::render('Dpl/DailyReports/Show', [
            'report' => $dailyReport,
        ]);
    }

    public function approve(KegiatanKkn $dailyReport): RedirectResponse
    {
        $dosen = auth()->user()->dosen;
        abort_if(!$dosen, 403, 'Data dosen tidak ditemukan.');
        $groupIds = $dosen->kelompokKkn()->pluck('id');
        abort_if(!$groupIds->contains($dailyReport->kelompok_id), 403);

        $dailyReport->update([
            'status' => 'approved',
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        // Notify student
        $dailyReport->mahasiswa->user->notify(new \App\Notifications\KknActivityNotification([
            'type' => 'success',
            'title' => 'Laporan Harian Disetujui',
            'message' => "Laporan harian Anda tanggal " . $dailyReport->date->format('d/m/Y') . " telah disetujui.",
            'icon' => 'check-circle',
            'url' => route('student.daily-reports.index'),
        ]));

        return redirect()->back()->with('success', 'Laporan harian disetujui.');
    }

    public function revision(Request $request, KegiatanKkn $dailyReport): RedirectResponse
    {
        $dosen = auth()->user()->dosen;
        abort_if(!$dosen, 403, 'Data dosen tidak ditemukan.');
        $groupIds = $dosen->kelompokKkn()->pluck('id');
        abort_if(!$groupIds->contains($dailyReport->kelompok_id), 403);

        $validated = $request->validate([
            'revision_notes' => ['required', 'string', 'max:1000'],
        ]);

        $dailyReport->update([
            'status' => 'revision',
            'review_notes' => $validated['revision_notes'],
        ]);

        // Notify student
        $dailyReport->mahasiswa->user->notify(new \App\Notifications\KknActivityNotification([
            'type' => 'warning',
            'title' => 'Revisi Laporan Harian',
            'message' => "Laporan harian Anda tanggal " . $dailyReport->date->format('d/m/Y') . " memerlukan revisi.",
            'icon' => 'exclamation-circle',
            'url' => route('student.daily-reports.index'),
        ]));

        return redirect()->back()->with('success', 'Laporan dikembalikan untuk revisi.');
    }
    public function batchApprove(Request $request): RedirectResponse
    {
        $dosen = auth()->user()->dosen;
        abort_if(!$dosen, 403, 'Data dosen tidak ditemukan.');
        $groupIds = $dosen->kelompokKkn()->pluck('id');

        $count = KegiatanKkn::whereIn('kelompok_id', $groupIds)
            ->where('status', 'submitted')
            ->update([
            'status' => 'approved',
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        return redirect()->back()->with('success', "{$count} laporan harian berhasil disetujui secara massal.");
    }
}