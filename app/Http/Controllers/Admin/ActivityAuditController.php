<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Str;
use App\Models\KKN\Laporan;
use App\Services\QualityAuditService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityAuditController extends Controller
{
    public function __construct(
        protected QualityAuditService $auditService
    ) {}

    public function index(Request $request): Response
    {
        $reports = Laporan::with(['user:id,name', 'kelompok:id,nama_kelompok'])
            ->latest('submitted_at')
            ->paginate(50);

        $auditedReports = $reports->through(function ($report) {
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

        return Inertia::render('Admin/QualityAudit/Index', [
            'reports' => $auditedReports,
            'stats' => [
                'high_risk_count' => Laporan::where('status', 'submitted')
                    ->whereRaw('LENGTH(description) < 30')
                    ->count(), // Heuristic for now
            ]
        ]);
    }
}
