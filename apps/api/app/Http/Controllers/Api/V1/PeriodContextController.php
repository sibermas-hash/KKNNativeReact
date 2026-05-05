<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Services\PeriodContextService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PeriodContextController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly PeriodContextService $periodContextService,
    ) {}

    /**
     * GET /api/v1/period-context
     * Returns the active period, available periods, and current phase.
     * Replaces HandleInertiaRequests and HandleActivePeriod shared data.
     */
    public function show(Request $request): JsonResponse
    {
        $activePeriod = $this->periodContextService->getActivePeriodData();
        $availablePeriods = $this->periodContextService->getAvailablePeriods();

        return $this->success([
            'active_period' => $activePeriod,
            'available_periods' => collect($availablePeriods)->flatten(1)->values()->all(),
            'current_phase' => $activePeriod['current_phase'] ?? 'upcoming',
        ], 'Konteks periode berhasil diambil.');
    }
}
