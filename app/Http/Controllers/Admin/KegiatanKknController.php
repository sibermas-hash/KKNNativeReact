<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\KegiatanKkn;
use App\Services\KKN\FacultyScopeService;
use App\Traits\HandlesPagination;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KegiatanKknController extends Controller
{
    use HandlesPagination;

    private function applyWorkflowStatusFilter($query, ?string $status): void
    {
        if (! filled($status)) {
            return;
        }

        match (KegiatanKkn::normalizeWorkflowStatus($status)) {
            KegiatanKkn::STATUS_DRAFT => $query->whereIn('status', KegiatanKkn::draftStatuses()),
            KegiatanKkn::STATUS_APPROVED => $query->whereIn('status', KegiatanKkn::approvedStatuses()),
            KegiatanKkn::STATUS_REVISION => $query->whereIn('status', KegiatanKkn::revisionStatuses()),
            default => $query->whereIn('status', KegiatanKkn::submittedStatuses()),
        };
    }

    public function index(Request $request): Response
    {
        if (! auth()->user()->hasAnyRole(['superadmin', 'admin', 'faculty_admin', 'dpl'])) {
            abort(403, 'Anda tidak memiliki hak akses untuk melihat laporan harian.');
        }

        $status = $request->input('status');
        $search = trim((string) $request->input('search'));

        $query = KegiatanKkn::with([
            'mahasiswa' => fn ($q) => $q->select('id', 'user_id', 'nama as name', 'nim'),
            'kelompok' => fn ($q) => $q->select('id', 'nama_kelompok as name'),
        ])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($nested) use ($search) {
                    $nested->where('title', 'like', "%{$search}%")
                        ->orWhere('activity', 'like', "%{$search}%")
                        ->orWhereHas('mahasiswa', function ($studentQuery) use ($search) {
                            $studentQuery->where('nama', 'like', "%{$search}%")
                                ->orWhere('nim', 'like', "%{$search}%");
                        });
                });
            });

        $this->applyWorkflowStatusFilter($query, $status);

        // Centralized faculty scoping
        $paginator = FacultyScopeService::apply($query, 'mahasiswa.fakultas_id')
            ->orderByDesc('date')
            ->paginate(15)
            ->withQueryString();

        $paginator->getCollection()->transform(fn (KegiatanKkn $report) => [
            'id' => $report->id,
            'date' => optional($report->date)->format('d M Y') ?? '-',
            'title' => $report->title,
            'status' => $report->canonicalStatus(),
            'student' => [
                'name' => $report->mahasiswa?->name ?? '-',
                'nim' => $report->mahasiswa?->nim ?? '-',
            ],
            'group' => [
                'name' => $report->kelompok?->name ?? '-',
            ],
        ]);

        return Inertia::render('Admin/Monitoring/DailyReports/Index', [
            'reports' => $this->formatPaginator($paginator),
            'filters' => [
                'status' => filled($status) ? KegiatanKkn::normalizeWorkflowStatus($status) : null,
                'search' => $search,
            ],
        ]);
    }

    public function show($id): Response
    {
        if (! auth()->user()->hasAnyRole(['superadmin', 'admin', 'faculty_admin', 'dpl'])) {
            abort(403, 'Anda tidak memiliki hak akses untuk melihat detail laporan harian.');
        }

        $report = KegiatanKkn::with([
            'mahasiswa' => fn ($q) => $q->select('id', 'user_id', 'nama as name', 'nim', 'prodi_id', 'fakultas_id')->with(['prodi:id,name', 'fakultas:id,name']),
            'kelompok' => fn ($q) => $q->select('id', 'nama_kelompok as name', 'location_id')->with('lokasi:id,village_name,district_name,regency_name'),
            'fileKegiatan',
            'reviewer:id,name'
        ])->findOrFail($id);

        return Inertia::render('Admin/Monitoring/DailyReports/Show', [
            'report' => [
                'id' => $report->id,
                'title' => $report->title,
                'activity' => $report->activity,
                'reflection' => $report->reflection,
                'social_media_link' => $report->social_media_link,
                'abcd_stage' => $report->abcd_stage,
                'date' => optional($report->date)->format('Y-m-d'),
                'formatted_date' => optional($report->date)->format('d M Y'),
                'status' => $report->canonicalStatus(),
                'status_label' => $report->status_label,
                'status_color' => $report->status_color,
                'ai_summary' => $report->ai_summary,
                'ai_analysis' => $report->ai_analysis,
                'student' => [
                    'name' => $report->mahasiswa?->name ?? '-',
                    'nim' => $report->mahasiswa?->nim ?? '-',
                    'prodi' => $report->mahasiswa?->prodi?->name ?? '-',
                    'fakultas' => $report->mahasiswa?->fakultas?->name ?? '-',
                ],
                'group' => [
                    'name' => $report->kelompok?->name ?? '-',
                    'location' => $report->kelompok?->lokasi?->village_name ? ($report->kelompok->lokasi->village_name . ', ' . $report->kelompok->lokasi->district_name) : '-',
                ],
                'files' => $report->fileKegiatan->map(fn ($f) => [
                    'id' => $f->id,
                    'file_path' => $f->file_path,
                    'file_type' => $f->file_type,
                    'original_name' => $f->original_name,
                ]),
                'review' => [
                    'reviewer_name' => $report->reviewer?->name ?? 'Sistem',
                    'notes' => $report->review_notes,
                    'reviewed_at' => $report->reviewed_at ? $report->reviewed_at->format('d M Y H:i') : null,
                ],
                'location_metadata' => [
                    'latitude' => $report->latitude,
                    'longitude' => $report->longitude,
                    'gps_accuracy' => $report->gps_accuracy,
                    'location_name' => $report->location_name,
                    'captured_at' => $report->captured_at ? $report->captured_at->format('d M Y H:i') : null,
                ]
            ]
        ]);
    }
}
