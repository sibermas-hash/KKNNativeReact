<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Services\KKN\KknWorkflowService;
use Illuminate\Http\JsonResponse;

class WorkflowStatusController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly KknWorkflowService $workflowService) {}

    public function __invoke(): JsonResponse
    {
        $mahasiswa = auth()->user()?->mahasiswa;
        $registration = $mahasiswa?->peserta()
            ->with(['periode.jenisKkn', 'kelompok'])
            ->latest()
            ->first();

        $workflow = $this->workflowService->state($registration);

        return $this->success([
            'registration_id' => $registration?->id,
            'status' => $registration?->status,
            'role' => $registration?->role,
            'kelompok_id' => $registration?->kelompok_id,
            'periode' => $registration?->periode?->only(['id', 'name', 'periode', 'current_phase']),
            'jenis_kkn' => $registration?->periode?->jenisKkn?->only(['id', 'code', 'name']),
            'workflow' => $workflow,
        ]);
    }
}
