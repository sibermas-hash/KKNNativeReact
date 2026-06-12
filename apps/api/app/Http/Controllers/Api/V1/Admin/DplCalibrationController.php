<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Periode;
use App\Services\KKN\DplScoreCalibrationService;
use Illuminate\Http\JsonResponse;

/**
 * R-003 fix (audit):
 * Promoted from a closure route in v1-admin.php to a proper controller so
 * EnsureAdminAuthorization's PERMISSION_MAP covers it. Closures return null
 * from $route->getController(), so the middleware's early-return caused the
 * closure route to skip the per-permission Gate check.
 */
class DplCalibrationController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly DplScoreCalibrationService $calibrationService
    ) {}

    public function show(Periode $periode): JsonResponse
    {
        // R13-API-008: standardize on ApiResponse envelope instead of raw response()->json.
        return $this->success($this->calibrationService->getCalibrationReport($periode->id));
    }
}
