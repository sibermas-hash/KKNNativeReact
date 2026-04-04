<?php

namespace App\Http\Controllers\Dpl;

use App\Http\Controllers\Controller;
use App\Models\KKN\FileKegiatanKkn;
use App\Models\KKN\KegiatanKkn;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DailyReportController extends Controller
{
    private function assignedGroupIds(): \Illuminate\Support\Collection
    {
        $dosen = auth()->user()->dosen;
        abort_if(!$dosen, 403, 'Data dosen tidak ditemukan.');

        return $dosen->kelompokKkn()->pluck('kelompok_kkn.id');
    }

    public function index(Request $request): Response
    {
        $groupIds = $this->assignedGroupIds();

        $kegiatan = KegiatanKkn::whereIn('kelompok_id', $groupIds)
            ->with(['mahasiswa', 'kelompok'])
            ->when($request->input('status'), fn($q, $s) => $q->where('status', $s))
            ->orderByDesc('date')
            ->paginate(15)
            ->through(fn (KegiatanKkn $report) => [
                'id' => $report->id,
                'date' => optional($report->date)->format('d M Y') ?? '-',
                'title' => $report->title,
                'status' => $report->status,
                'student' => [
                    'name' => $report->mahasiswa?->nama ?? 'Mahasiswa tidak ditemukan',
                    'nim' => $report->mahasiswa?->nim ?? '-',
                ],
                'group' => [
                    'name' => $report->kelompok?->nama_kelompok ?? $report->kelompok?->code ?? '-',
                ],
            ])
            ->withQueryString();

        return Inertia::render('Dpl/DailyReports/Index', [
            'reports' => $kegiatan,
            'filters' => $request->only('status'),
        ]);
    }

    public function show(KegiatanKkn $dailyReport): Response
    {
        $groupIds = $this->assignedGroupIds();
        abort_if(!$groupIds->contains($dailyReport->kelompok_id), 403, 'Anda tidak memiliki akses ke laporan ini.');

        $dailyReport->load(['mahasiswa', 'kelompok.lokasi', 'fileKegiatan', 'reviewer']);

        return Inertia::render('Dpl/DailyReports/Show', [
            'report' => [
                'id' => $dailyReport->id,
                'date' => optional($dailyReport->date)->format('d M Y') ?? '-',
                'title' => $dailyReport->title,
                'activity' => $dailyReport->activity,
                'output' => $dailyReport->output,
                'latitude' => $dailyReport->latitude,
                'longitude' => $dailyReport->longitude,
                'status' => $dailyReport->status,
                'review_notes' => $dailyReport->review_notes,
                'student' => [
                    'name' => $dailyReport->mahasiswa?->nama ?? 'Mahasiswa tidak ditemukan',
                    'nim' => $dailyReport->mahasiswa?->nim ?? '-',
                ],
                'group' => [
                    'name' => $dailyReport->kelompok?->nama_kelompok ?? $dailyReport->kelompok?->code ?? '-',
                    'location' => [
                        'village_name' => $dailyReport->kelompok?->lokasi?->village_name,
                        'address' => $dailyReport->kelompok?->lokasi?->address,
                    ],
                ],
                'file_kegiatan' => $dailyReport->fileKegiatan->map(fn (FileKegiatanKkn $file) => [
                    'id' => $file->id,
                    'file_name' => $file->file_name,
                    'download_url' => route('dpl.daily-reports.files.download', $file),
                ])->values(),
            ],
        ]);
    }

    public function downloadFile(FileKegiatanKkn $fileKegiatan): StreamedResponse
    {
        $groupIds = $this->assignedGroupIds();
        $fileKegiatan->loadMissing('kegiatan');

        abort_if(
            !$fileKegiatan->kegiatan || !$groupIds->contains($fileKegiatan->kegiatan->kelompok_id),
            403,
            'Anda tidak memiliki akses ke lampiran ini.'
        );

        abort_unless(Storage::disk('local')->exists($fileKegiatan->file_path), 404, 'File lampiran tidak ditemukan.');

        return Storage::disk('local')->download(
            $fileKegiatan->file_path,
            $fileKegiatan->file_name ?: basename($fileKegiatan->file_path)
        );
    }

    public function approve(KegiatanKkn $dailyReport): RedirectResponse
    {
        $groupIds = $this->assignedGroupIds();
        abort_if(!$groupIds->contains($dailyReport->kelompok_id), 403);

        $dailyReport->update([
            'status' => 'approved',
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        // Notify student
        if ($dailyReport->mahasiswa?->user) {
            $dailyReport->mahasiswa->user->notify(new \App\Notifications\KknActivityNotification([
                'type' => 'success',
                'title' => 'Laporan Harian Disetujui',
                'message' => "Laporan harian Anda tanggal " . $dailyReport->date->format('d/m/Y') . " telah disetujui.",
                'icon' => 'check-circle',
                'url' => route('student.daily-reports.index'),
            ]));
        }

        return redirect()->back()->with('success', 'Laporan harian disetujui.');
    }

    public function revision(Request $request, KegiatanKkn $dailyReport): RedirectResponse
    {
        $groupIds = $this->assignedGroupIds();
        abort_if(!$groupIds->contains($dailyReport->kelompok_id), 403);

        $validated = $request->validate([
            'revision_notes' => ['required', 'string', 'max:1000'],
        ]);

        $dailyReport->update([
            'status' => 'revision',
            'review_notes' => $validated['revision_notes'],
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        // Notify student
        if ($dailyReport->mahasiswa?->user) {
            $dailyReport->mahasiswa->user->notify(new \App\Notifications\KknActivityNotification([
                'type' => 'warning',
                'title' => 'Revisi Laporan Harian',
                'message' => "Laporan harian Anda tanggal " . $dailyReport->date->format('d/m/Y') . " memerlukan revisi.",
                'icon' => 'exclamation-circle',
                'url' => route('student.daily-reports.index'),
            ]));
        }

        return redirect()->back()->with('success', 'Laporan dikembalikan untuk revisi.');
    }
    public function batchApprove(Request $request): RedirectResponse
    {
        $groupIds = $this->assignedGroupIds();

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
