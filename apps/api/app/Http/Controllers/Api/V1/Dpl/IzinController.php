<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Dpl;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\IzinMeninggalkan;
use App\Services\IzinService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IzinController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly IzinService $izinService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $dosen = auth()->user()->dosen;
        if (! $dosen) {
            return $this->success(['izin' => []]);
        }

        $groupIds = $dosen->kelompokKkn()->pluck('kelompok_kkn.id');

        $izin = IzinMeninggalkan::whereIn('kelompok_id', $groupIds)
            ->with(['mahasiswa.user', 'kelompok'])
            ->orderBy('status')
            ->orderByDesc('created_at')
            ->paginate($request->input('per_page', 25));

        return $this->successCollection(
            \App\Http\Resources\Api\V1\IzinMeninggalkanResource::collection($izin)
        );
    }

    public function approve(IzinMeninggalkan $izin): JsonResponse
    {
        $this->authorizeDplAccess($izin);

        $this->izinService->setujuiIzin(auth()->user(), $izin);

        return $this->success(['id' => $izin->id, 'status' => 'disetujui'], 'Izin berhasil disetujui.');
    }

    public function reject(Request $request, IzinMeninggalkan $izin): JsonResponse
    {
        $this->authorizeDplAccess($izin);

        $validated = $request->validate([
            'catatan' => ['nullable', 'string', 'max:500'],
            'rejection_reason' => ['nullable', 'string', 'max:500'],
        ]);

        $reason = $validated['rejection_reason'] ?? $validated['catatan'] ?? null;
        if (! $reason) {
            return $this->validationError(['rejection_reason' => ['Alasan penolakan wajib diisi.']]);
        }

        $this->izinService->tolakIzin(auth()->user(), $izin, $reason);

        return $this->success(['id' => $izin->id, 'status' => 'ditolak'], 'Izin berhasil ditolak.');
    }

    private function authorizeDplAccess(IzinMeninggalkan $izin): void
    {
        $dosen = auth()->user()->dosen;
        abort_if(! $dosen, 403, 'Data dosen tidak ditemukan.');

        $groupIds = $dosen->kelompokKkn()->pluck('kelompok_kkn.id');
        abort_unless($groupIds->contains($izin->kelompok_id), 403, 'Anda tidak memiliki akses ke izin ini.');
    }
}
