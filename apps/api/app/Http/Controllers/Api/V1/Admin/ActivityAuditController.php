<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Laporan;
use App\Services\QualityAuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityAuditController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly QualityAuditService $auditService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $reports = Laporan::with(['user:id,name', 'kelompok:id,nama_kelompok'])
            ->latest('submitted_at')
            ->paginate($request->input('per_page', 50));

        $items = $reports->getCollection()->map(function ($report) {
            $audit = $this->auditService->auditReport($report);

            return [
                'id' => $report->id,
                'user_name' => $report->user?->name,
                'group_name' => $report->kelompok?->nama_kelompok,
                'title' => $report->title,
                'submitted_at' => $report->submitted_at?->format('d M Y H:i'),
                'risk_score' => $audit['risk_score'] ?? 0,
                'risk_level' => $audit['risk_level'] ?? 'low',
                'flags' => $audit['flags'] ?? [],
            ];
        });

        return $this->success([
            'data' => $items,
            'meta' => [
                'current_page' => $reports->currentPage(),
                'last_page' => $reports->lastPage(),
                'per_page' => $reports->perPage(),
                'total' => $reports->total(),
            ],
        ]);
    }
}
