<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Periode;
use App\Services\YudisiumService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class YudisiumController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly YudisiumService $yudisiumService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $periodeId = $request->integer('periode_id') ?: null;

        $periodes = Periode::orderByDesc('start_date')->get(['id', 'name']);

        $rekap = $periodeId
            ? $this->yudisiumService->generateRekapYudisium($periodeId)
            : null;

        return $this->success([
            'periodes' => $periodes,
            'rekap' => $rekap,
            'selected_periode_id' => $periodeId,
        ]);
    }

    public function proses(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'periode_id' => ['required', 'exists:periode,id'],
        ]);

        $hasil = $this->yudisiumService->prosesYudisiumPeriode((int) $validated['periode_id']);

        return $this->success($hasil, "Proses yudisium selesai. Total: {$hasil['total']}, Lulus: {$hasil['lulus']}, Tidak Lulus: {$hasil['tidak_lulus']}");
    }
}
