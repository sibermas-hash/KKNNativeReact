<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\LaporanAkhir;
use App\Traits\HandlesPagination;
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
        $report->load(['mahasiswa.user', 'kelompok.dosen.user', 'reviewer']);

        return Inertia::render('Admin/Monitoring/FinalReports/Show', [
            'report' => $report,
        ]);
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
