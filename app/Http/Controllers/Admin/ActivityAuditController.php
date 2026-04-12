<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\Laporan;
use App\Services\QualityAuditService;
use App\Traits\HandlesPagination;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ActivityAuditController extends Controller
{
    use HandlesPagination;

    public function __construct(
        protected QualityAuditService $auditService
    ) {}

    public function index(Request $request): Response
    {
        $reports = Laporan::with(['user:id,name', 'kelompok:id,nama_kelompok'])
            ->latest('submitted_at')
            ->paginate(50);

        $reports->through(function ($report) {
            $audit = $this->auditService->auditReport($report);

            return [
                'id' => $report->id,
                'user_name' => $report->user->name,
                'group_name' => $report->kelompok->nama_kelompok,
                'title' => $report->title,
                'submitted_at' => $report->submitted_at->format('d M Y H:i'),
                'risk_score' => $audit['risk_score'],
                'risk_level' => $audit['level'],
                'risk_flags' => $audit['flags'],
                'description_preview' => Str::limit($report->description, 100),
            ];
        });

        return Inertia::render('Admin/Monitoring/QualityAudit/Index', [
            'reports' => $this->formatPaginator($reports),
            'stats' => [
                'high_risk_count' => Laporan::where('status', 'submitted')
                    ->where(DB::raw('LENGTH(description)'), '<', 30)
                    ->count(),
            ],
        ]);
    }
}
