<?php

declare(strict_types=1);

namespace App\Http\Controllers\Dpl;

use App\Http\Controllers\Controller;
use App\Models\KKN\LaporanAkhir;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FinalReportController extends Controller
{
    private function assignedGroupIds(): \Illuminate\Support\Collection
    {
        $dosen = auth()->user()->dosen;
        abort_if(! $dosen, 403, 'Data dosen tidak ditemukan.');

        return $dosen->kelompokKkn()->pluck('kelompok_kkn.id');
    }

    private function canReview(LaporanAkhir $report): bool
    {
        return in_array($report->status, ['submitted', 'revision'], true);
    }

    public function index(Request $request): Response
    {
        $groupIds = $this->assignedGroupIds();

        $reports = LaporanAkhir::whereIn('kelompok_id', $groupIds)
            ->with(['mahasiswa', 'kelompok'])
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->orderByDesc('submitted_at')
            ->paginate(15)
            ->through(fn (LaporanAkhir $report) => [
                'id' => $report->id,
                'title' => $report->title,
                'status' => $report->status,
                'submitted_at' => optional($report->submitted_at)->format('d M Y H:i'),
                'review_notes' => $report->review_notes,
                'mahasiswa' => [
                    'nama' => $report->mahasiswa?->nama ?? 'Mahasiswa tidak ditemukan',
                    'nim' => $report->mahasiswa?->nim ?? '-',
                ],
                'kelompok' => [
                    'nama_kelompok' => $report->kelompok?->nama_kelompok ?? $report->kelompok?->code ?? '-',
                ],
            ])
            ->withQueryString();

        return Inertia::render('Dpl/FinalReports/Index', [
            'reports' => $reports,
            'filters' => $request->only('status'),
        ]);
    }

    public function show(LaporanAkhir $report): Response
    {
        $groupIds = $this->assignedGroupIds();
        abort_if(! $groupIds->contains($report->kelompok_id), 403, 'Anda tidak memiliki akses ke laporan ini.');

        $report->load(['mahasiswa', 'kelompok.lokasi']);

        return Inertia::render('Dpl/FinalReports/Show', [
            'report' => [
                'id' => $report->id,
                'title' => $report->title,
                'abstract' => $report->abstract,
                'file_name' => $report->file_name,
                'status' => $report->status,
                'can_review' => $this->canReview($report),
                'submitted_at' => optional($report->submitted_at)->format('d M Y H:i'),
                'review_notes' => $report->review_notes,
                'download_url' => route('dpl.final-reports.download', $report),
                'mahasiswa' => [
                    'nama' => $report->mahasiswa?->nama ?? 'Mahasiswa tidak ditemukan',
                    'nim' => $report->mahasiswa?->nim ?? '-',
                ],
                'kelompok' => [
                    'nama_kelompok' => $report->kelompok?->nama_kelompok ?? $report->kelompok?->code ?? '-',
                    'lokasi' => [
                        'village_name' => $report->kelompok?->lokasi?->village_name,
                        'district_name' => $report->kelompok?->lokasi?->district_name,
                        'regency_name' => $report->kelompok?->lokasi?->regency_name,
                    ],
                ],
            ],
        ]);
    }

    public function download(LaporanAkhir $report): StreamedResponse
    {
        $groupIds = $this->assignedGroupIds();
        abort_if(! $groupIds->contains($report->kelompok_id), 403, 'Anda tidak memiliki akses ke laporan ini.');
        abort_if(! $report->file_path, 404, 'Dokumen laporan akhir tidak ditemukan.');

        $disk = Storage::disk('local')->exists($report->file_path)
            ? 'local'
            : (Storage::disk('public')->exists($report->file_path) ? 'public' : null);

        abort_if($disk === null, 404, 'Dokumen laporan akhir tidak ditemukan.');

        return Storage::disk($disk)->download(
            $report->file_path,
            $report->file_name ?: basename($report->file_path)
        );
    }

    public function approve(LaporanAkhir $report): RedirectResponse
    {
        $groupIds = $this->assignedGroupIds();
        abort_if(! $groupIds->contains($report->kelompok_id), 403, 'Anda tidak memiliki akses ke laporan ini.');

        if (! $this->canReview($report)) {
            return back()->with('error', 'Laporan akhir ini sudah selesai ditinjau dan tidak dapat diproses ulang.');
        }

        $report->update([
            'status' => 'approved',
            'review_notes' => null,
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        // Notify student
        if ($report->mahasiswa?->user) {
            $report->mahasiswa->user->notify(new \App\Notifications\KknActivityNotification([
                'type' => 'success',
                'title' => 'Laporan Akhir Disetujui',
                'message' => 'Laporan akhir Anda ('.e($report->title).') telah disetujui oleh DPL.',
                'icon' => 'check-circle',
                'action' => route('student.dashboard'),
            ]));
        }

        return redirect()->back()->with('success', 'Laporan akhir berhasil disetujui.');
    }

    public function revision(Request $request, LaporanAkhir $report): RedirectResponse
    {
        $groupIds = $this->assignedGroupIds();
        abort_if(! $groupIds->contains($report->kelompok_id), 403, 'Anda tidak memiliki akses ke laporan ini.');

        if (! $this->canReview($report)) {
            return back()->with('error', 'Laporan akhir ini sudah selesai ditinjau dan tidak dapat diproses ulang.');
        }

        $validated = $request->validate([
            'notes' => ['required', 'string', 'max:1000'],
        ]);

        $report->update([
            'status' => 'revision',
            'review_notes' => $validated['notes'],
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        // Notify student
        if ($report->mahasiswa?->user) {
            $report->mahasiswa->user->notify(new \App\Notifications\KknActivityNotification([
                'type' => 'warning',
                'title' => 'Revisi Laporan Akhir',
                'message' => 'Laporan akhir Anda memerlukan perbaikan. Catatan: '.e($validated['notes']),
                'icon' => 'exclamation-triangle',
                'action' => route('student.dashboard'),
            ]));
        }

        return redirect()->back()->with('success', 'Laporan akhir dikembalikan untuk revisi.');
    }
}
