<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\LaporanAkhir;
use App\Traits\HandlesPagination;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class LaporanAkhirController extends Controller
{
    use HandlesPagination;

    public function index(Request $request): Response
    {
        Gate::authorize('view-reports');
        $status = $request->filled('status')
            ? LaporanAkhir::normalizeWorkflowStatus($request->string('status')->toString())
            : null;

        $user = auth()->user();
        $isFacultyAdmin = $user?->hasRole('faculty_admin');
        $facultyId = $isFacultyAdmin ? $user?->fakultas_id : null;

        $reports = LaporanAkhir::with(['mahasiswa', 'kelompok'])
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($facultyId, fn ($q) => $q->whereHas('mahasiswa', fn ($m) => $m->where('fakultas_id', $facultyId)))
            ->orderByDesc('submitted_at')
            ->paginate(15)
            ->through(fn (LaporanAkhir $report) => [
                'id' => $report->id,
                'title' => $report->title,
                'status' => $report->canonicalStatus(),
                'submitted_at' => optional($report->submitted_at)?->toIso8601String(),
                'mahasiswa' => [
                    'nama' => $report->mahasiswa?->nama,
                    'nim' => $report->mahasiswa?->nim,
                ],
                'kelompok' => [
                    'nama_kelompok' => $report->kelompok?->nama_kelompok ?? $report->kelompok?->code,
                ],
            ])
            ->withQueryString();

        return Inertia::render('Admin/Monitoring/FinalReports/Index', [
            'reports' => Inertia::defer(fn () => $this->formatPaginator($reports)),
            'filters' => ['status' => $status],
        ]);
    }

    public function show(LaporanAkhir $report): Response
    {
        Gate::authorize('view-reports');
        $report->load(['mahasiswa.user', 'kelompok.dosen.user', 'reviewer']);

        return Inertia::render('Admin/Monitoring/FinalReports/Show', [
            'report' => [
                'id' => $report->id,
                'title' => $report->title,
                'abstract' => $report->abstract,
                'status' => $report->canonicalStatus(),
                'video_link' => $report->video_link,
                'news_link' => $report->news_link,
                'file_path' => $report->file_path,
                'file_name' => $report->file_name,
                'article_1_path' => $report->article_1_path,
                'article_2_path' => $report->article_2_path,
                'poster_1_path' => $report->poster_1_path,
                'poster_2_path' => $report->poster_2_path,
                'poster_3_path' => $report->poster_3_path,
                'submitted_at' => optional($report->submitted_at)?->toIso8601String(),
                'review_notes' => $report->review_notes,
                'reviewed_at' => optional($report->reviewed_at)?->toIso8601String(),
                'mahasiswa' => [
                    'nama' => $report->mahasiswa?->nama,
                    'nim' => $report->mahasiswa?->nim,
                ],
                'kelompok' => [
                    'nama_kelompok' => $report->kelompok?->nama_kelompok ?? $report->kelompok?->code,
                    'dpl' => [
                        'user' => [
                            'name' => $report->kelompok?->dosen?->user?->name,
                        ],
                    ],
                ],
                'reviewer' => [
                    'name' => $report->reviewer?->name,
                ],
            ],
        ]);
    }

    public function updateStatus(Request $request, LaporanAkhir $report): RedirectResponse
    {
        Gate::authorize('manage-reports');

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:approved,revision'],
            'review_notes' => ['nullable', 'string', 'max:1000', 'required_if:status,revision'],
        ]);

        $nextStatus = LaporanAkhir::normalizeWorkflowStatus($validated['status']);

        $report->update([
            'status' => $nextStatus,
            'review_notes' => $nextStatus === LaporanAkhir::STATUS_REVISION
                ? $validated['review_notes']
                : null,
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Status laporan akhir berhasil diperbarui.');
    }

    public function download(Request $request, LaporanAkhir $report)
    {
        Gate::authorize('view-reports');

        $pathKey = $request->input('asset', 'file_path');
        $allowedKeys = ['file_path', 'article_1_path', 'article_2_path', 'poster_1_path', 'poster_2_path', 'poster_3_path'];

        if (! in_array($pathKey, $allowedKeys)) {
            abort(403);
        }

        $path = $report->{$pathKey};

        if (! $path) {
            abort(404, 'Asset tidak ditemukan.');
        }

        $disk = Storage::disk(config('filesystems.default'));

        if (! $disk->exists($path)) {
            abort(404, 'File fisik tidak ditemukan di storage.');
        }

        // Handle local vs cloud
        if (config('filesystems.default') === 'local') {
            return response()->file($disk->path($path));
        }

        return redirect()->away($disk->temporaryUrl($path, now()->addMinutes(30)));
    }
}
