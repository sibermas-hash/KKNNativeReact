<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Dpl;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\MonitoringDplResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\KelompokKkn;
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
            MonitoringDplResource::collection($monitoring)
        );
    }

    /**
     * Data form untuk membuat monitoring baru (kelompok yang ditugaskan).
     */
    public function create(): JsonResponse
    {
        $dosen = auth()->user()->dosen;
        if (! $dosen) {
            return $this->forbidden();
        }

        $groups = $dosen->kelompokKkn()
            ->with('lokasi')
            ->get()
            ->map(fn ($g) => [
                'id' => $g->id,
                'nama_kelompok' => $g->nama_kelompok,
                'code' => $g->code,
                'lokasi' => $g->lokasi?->village_name,
                'visit_count' => MonitoringDpl::where('dpl_id', $dosen->id)
                    ->where('kelompok_id', $g->id)
                    ->count(),
            ]);

        return $this->success(['groups' => $groups]);
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
            'permasalahan' => ['required', 'string', 'min:10'],
            'solusi' => ['required', 'string', 'min:10'],
            'catatan_tambahan' => ['nullable', 'string'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'photo' => ['nullable', 'file', 'mimes:jpg,jpeg,png', 'max:5120'],
        ]);

        // Verify DPL owns this group
        $ownsGroup = $dosen->kelompokKkn()
            ->where('kelompok_kkn.id', $validated['kelompok_id'])
            ->exists();
        abort_unless($ownsGroup, 403, 'Anda tidak membimbing kelompok ini.');

        $kelompok = KelompokKkn::find($validated['kelompok_id']);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('monitoring', config('filesystems.default'));
        }

        $monitoring = MonitoringDpl::create([
            'dpl_id' => $dosen->id,
            'kelompok_id' => $validated['kelompok_id'],
            'periode_id' => $kelompok->periode_id,
            'tanggal_kunjungan' => $validated['visit_date'],
            'permasalahan' => $validated['permasalahan'],
            'solusi' => $validated['solusi'],
            'catatan_tambahan' => $validated['catatan_tambahan'] ?? null,
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'photo_path' => $photoPath,
        ]);

        return $this->created(['id' => $monitoring->id], 'Monitoring berhasil dicatat.');
    }
}
