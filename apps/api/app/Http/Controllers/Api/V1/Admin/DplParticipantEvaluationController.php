<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Dosen;
use App\Services\KKN\DplParticipantEvaluationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DplParticipantEvaluationController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly DplParticipantEvaluationService $service) {}

    public function index(Request $request): JsonResponse
    {
        $data = $this->service->adminOverview(
            $request->user(),
            $request->only(['period_id', 'search', 'recommendation'])
        );

        return $this->success($data);
    }

    public function show(Request $request, Dosen $dosen): JsonResponse
    {
        $data = $this->service->adminDetail(
            $request->user(),
            $dosen,
            $request->filled('period_id') ? $request->integer('period_id') : null
        );

        return $this->success($data);
    }

    public function export(Request $request)
    {
        return $this->service->exportAdminOverview(
            $request->user(),
            $request->only(['period_id', 'search', 'recommendation'])
        );
    }
}
