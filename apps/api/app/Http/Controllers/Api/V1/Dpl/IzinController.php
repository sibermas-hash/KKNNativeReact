<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Dpl;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\IzinMeninggalkan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IzinController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $dosen = auth()->user()->dosen;
        if (! $dosen) {
            return $this->success(['izin' => []]);
        }

        $groupIds = $dosen->kelompokKkn()->pluck('kelompok_kkn.id');

        $izin = IzinMeninggalkan::whereIn('kelompok_id', $groupIds)
            ->with(['mahasiswa.user'])
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->orderByDesc('created_at')
            ->paginate($request->input('per_page', 25));

        return $this->successCollection(
            \App\Http\Resources\Api\V1\IzinMeninggalkanResource::collection($izin)
        );
    }

    public function approve(IzinMeninggalkan $izin): JsonResponse
    {
        $izin->update(['status' => 'approved']);

        return $this->success(['id' => $izin->id, 'status' => 'approved'], 'Izin disetujui.');
    }

    public function reject(Request $request, IzinMeninggalkan $izin): JsonResponse
    {
        $request->validate(['rejection_reason' => ['required', 'string', 'max:500']]);

        $izin->update([
            'status' => 'rejected',
            'rejection_reason' => $request->input('rejection_reason'),
        ]);

        return $this->success(['id' => $izin->id, 'status' => 'rejected'], 'Izin ditolak.');
    }
}
