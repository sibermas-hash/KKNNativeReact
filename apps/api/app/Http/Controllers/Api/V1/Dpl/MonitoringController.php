<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Dpl;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\MonitoringDpl;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MonitoringController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $dosen = auth()->user()->dosen;
        if (! $dosen) {
            return $this->success(['monitoring' => []]);
        }

        $monitoring = MonitoringDpl::where('dpl_id', $dosen->id)
            ->with(['kelompok'])
            ->orderByDesc('tanggal_kunjungan')
            ->paginate(25);

        return $this->successCollection(
            \App\Http\Resources\Api\V1\MonitoringDplResource::collection($monitoring)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $dosen = auth()->user()->dosen;
        if (! $dosen) {
            return $this->forbidden();
        }

        $validated = $request->validate([
            'kelompok_id' => ['required', 'exists:kelompok_kkn,id'],
            'visit_date' => ['required', 'date'],
            'notes' => ['required', 'string', 'max:5000'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'photo' => ['nullable', 'file', 'mimes:jpg,jpeg,png', 'max:5120'],
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('monitoring', config('filesystems.default'));
        }

        $monitoring = MonitoringDpl::create([
            'dpl_id' => $dosen->id,
            'kelompok_id' => $validated['kelompok_id'],
            'periode_id' => auth()->user()->dosen->dplPeriods()->first()?->periode_id,
            'tanggal_kunjungan' => $validated['visit_date'],
            'permasalahan' => '-',
            'solusi' => '-',
            'catatan_tambahan' => $validated['notes'],
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'photo_path' => $photoPath,
        ]);

        return $this->created(['id' => $monitoring->id], 'Monitoring berhasil dicatat.');
    }
}
