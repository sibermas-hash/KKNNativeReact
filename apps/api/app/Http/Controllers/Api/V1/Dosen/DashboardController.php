<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Dosen;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\DplPeriodResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\PesertaWorkshop;
use App\Models\KKN\Workshop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();
        $dosen = $user->dosen;

        if (! $dosen) {
            return $this->success([
                'dpl_periods' => [],
                'workshops' => [],
                'is_dpl' => false,
            ]);
        }

        $dplPeriods = DplPeriod::where('dosen_id', $dosen->id)
            ->with(['periode.jenisKkn', 'kelompok'])
            ->orderByDesc('created_at')
            ->get();

        $isDpl = $user->hasRole('dpl');

        // Workshops available to this dosen
        $workshopIds = PesertaWorkshop::where('user_id', $user->id)->pluck('workshop_id');
        $workshops = Workshop::whereIn('id', $workshopIds)
            ->orWhere('status', 'published')
            ->orderByDesc('workshop_date')
            ->limit(10)
            ->get();

        return $this->success([
            'dpl_periods' => DplPeriodResource::collection($dplPeriods),
            'workshops' => $workshops->map(fn ($w) => [
                'id' => $w->id,
                'title' => $w->title,
                'date' => $w->workshop_date?->toDateString(),
                'status' => $w->status,
            ]),
            'is_dpl' => $isDpl,
        ]);
    }
}
