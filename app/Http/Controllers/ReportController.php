<?php

namespace App\Http\Controllers;

use App\Models\KKN\Laporan;
use App\Services\ReportManagementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ReportController extends Controller
{
    protected $reportService;

    public function __construct(ReportManagementService $reportService)
    {
        $this->reportService = $reportService;
    }

    /**
     * Display reports management
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->hasAnyRole(['superadmin', 'dpl'])) {
            $baseQuery = Laporan::query()
                ->with([
                    'user:id,name',
                    'kelompok:id,nama_kelompok,location_id',
                    'kelompok.lokasi:id,village_name,district_name,regency_name',
                ]);

            if ($user->hasRole('dpl')) {
                $groupIds = $user->dosen
                    ?->kelompokKkn()
                    ->pluck('kelompok_kkn.id')
                    ?? collect();

                $baseQuery->whereIn('kelompok_id', $groupIds);
            }

            $summary = [
                'total_reports' => (clone $baseQuery)->count(),
                'pending_review' => (clone $baseQuery)->where('status', 'submitted')->count(),
            ];

            $reports = (clone $baseQuery)
                ->latest()
                ->paginate(10)
                ->through(fn (Laporan $report) => [
                    'id' => $report->id,
                    'title' => $report->title,
                    'type' => $report->type,
                    'status' => $report->status,
                    'file_name' => $report->file_name,
                    'submitted_at' => optional($report->submitted_at)?->toIso8601String(),
                    'user' => [
                        'name' => $report->user?->name ?? '-',
                    ],
                    'group' => [
                        'name' => $report->kelompok?->nama_kelompok ?? '-',
                        'village' => $report->kelompok?->lokasi?->full_name
                            ?? $report->kelompok?->lokasi?->village_name
                            ?? '-',
                    ],
                ]);

            return Inertia::render('Admin/Reports/Index', [
                'summary' => $summary,
                'reports' => $reports,
            ]);
        }

        // For Student, show their progress
        $groupId = $user->getActiveGroupId();

        if ($groupId) {
            $progress = $this->reportService->getStudentReportProgress($user->id, $groupId);

            return Inertia::render('Student/Reports/Index', [
                'progress' => collect($progress)->map(fn (array $item) => [
                    'type' => $item['type'],
                    'name' => $item['name'],
                    'status' => $item['status'],
                    'report' => $item['report'] ? [
                        'id' => $item['report']->id,
                        'title' => $item['report']->title,
                        'file_name' => $item['report']->file_name,
                        'status' => $item['report']->status,
                        'submitted_at' => optional($item['report']->submitted_at)?->toIso8601String(),
                    ] : null,
                ])->values(),
                'reportTypes' => collect(ReportManagementService::REPORT_TYPES)
                    ->map(fn (array $config, string $type) => [
                        'type' => $type,
                        'name' => $config['name'],
                        'allowed_types' => $config['allowed_types'],
                        'max_size_mb' => (int) round($config['max_size'] / 1048576),
                    ])
                    ->values(),
            ]);
        }

        return redirect()->route('dashboard')->with('error', 'Belum memiliki kelompok.');
    }

    /**
     * Upload a report
     */
    public function upload(Request $request)
    {
        $availableTypes = array_keys(ReportManagementService::REPORT_TYPES);
        $allowedMimeTypes = collect(ReportManagementService::REPORT_TYPES)
            ->flatMap(fn (array $config) => $config['allowed_types'])
            ->unique()
            ->implode(',');

        $validated = $request->validate([
            'type' => ['required', 'string', Rule::in($availableTypes)],
            'title' => 'required|string|max:255',
            'file' => 'required|file|max:512000|mimes:' . $allowedMimeTypes,
        ]);

        $user = $request->user();
        $groupId = $user->getActiveGroupId();

        if (!$groupId) {
            return back()->with('error', 'Kelompok tidak ditemukan.');
        }

        try {
            $this->reportService->uploadReport(
                $user->id,
                $groupId,
                $validated['type'],
                $request->file('file'),
                $validated['title']
            );
        } catch (\InvalidArgumentException $exception) {
            return back()
                ->withErrors(['file' => $exception->getMessage()])
                ->withInput();
        }

        return back()->with('success', 'Laporan berhasil diunggah.');
    }

    public function download(Laporan $report)
    {
        $user = auth()->user();

        abort_unless($user, 403);

        if ($user->hasRole('student')) {
            abort_if($report->user_id !== $user->id, 403, 'Anda tidak memiliki akses ke file laporan ini.');
        } elseif ($user->hasRole('dpl') && !$user->hasRole('superadmin')) {
            $dosen = $user->dosen;
            abort_if(!$dosen, 403, 'Data dosen tidak ditemukan.');

            $isAssigned = $dosen->kelompokKkn()
                ->where('kelompok_kkn.id', $report->kelompok_id)
                ->exists();

            abort_if(!$isAssigned, 403, 'Anda tidak memiliki akses ke file laporan ini.');
        } else {
            abort_unless($user->hasRole('superadmin'), 403, 'Anda tidak memiliki akses ke file laporan ini.');
        }

        [$disk, $path] = $this->resolveReportStorage($report->file_path);

        if (!$path) {
            abort(404, 'File laporan tidak ditemukan.');
        }

        return Storage::disk($disk)->download(
            $path,
            $report->file_name ?: basename($path)
        );
    }

    public function showEvidence(\App\Models\KKN\NilaiKkn $score)
    {
        $user = auth()->user();

        // Authorization check
        if (!$user->hasRole('superadmin')) {
            if (!$user->hasRole('dpl')) {
                abort(403);
            }

            // If DPL, must be assigned to this group as Ketua
            $dosen = $user->dosen;
            $isAssigned = $dosen->kelompokKkn()
                ->where('kelompok_kkn.id', $score->kelompok_id)
                ->wherePivot('role', 'Ketua')
                ->exists();

            abort_if(!$isAssigned, 403, 'Anda tidak memiliki akses ke bukti nilai kelompok ini.');
        }

        // VULN-011 Fix: Validate file path to prevent path traversal
        if (!$score->evidence_file) {
            abort(404, 'File bukti tidak ditemukan.');
        }
        
        // Ensure path is within expected directory
        $basePath = 'evidence/';
        if (str_starts_with($score->evidence_file, '../') || !str_starts_with($score->evidence_file, $basePath)) {
            abort(403, 'Path file tidak valid.');
        }

        if (!\Illuminate\Support\Facades\Storage::exists($score->evidence_file)) {
            abort(404, 'File bukti tidak ditemukan.');
        }

        return \Illuminate\Support\Facades\Storage::download($score->evidence_file);
    }

    private function resolveReportStorage(?string $path): array
    {
        if (!$path) {
            return ['local', null];
        }

        if (Storage::disk('local')->exists($path)) {
            return ['local', $path];
        }

        if (Storage::disk('public')->exists($path)) {
            return ['public', $path];
        }

        return ['local', null];
    }
}
