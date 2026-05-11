<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\DispensasiKkn;
use App\Models\KKN\IzinMeninggalkan;
use App\Models\KKN\Periode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DispensasiController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $dispensasi = DispensasiKkn::with(['periode:id,name,periode', 'grantedByUser:id,name'])
            ->when($request->input('search'), function ($q, $search) {
                // R13-SEC-007 + R13-SEC-010: use QueryHelper for consistency and drop
                // the orWhere('alasan', 'ilike', ...) — `alasan` is encrypted-at-rest
                // so LIKE on ciphertext never matches (dead code path).
                $s = \App\Helpers\QueryHelper::escapeLike($search);
                $q->where('nim', 'ilike', "%{$s}%");
            })
            ->latest()
            ->paginate(15);

        $izins = IzinMeninggalkan::with(['mahasiswa', 'kelompok'])
            ->orderBy('status')
            ->orderByDesc('created_at')
            ->paginate(15, ['*'], 'izins_page');

        $periods = Periode::orderByDesc('periode')->get(['id', 'name', 'periode']);

        return $this->success([
            'dispensasi' => $dispensasi,
            'izins'      => $izins,
            'periods'    => $periods,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nim'                    => ['required', 'string', 'max:20'],
            'periode_id'             => ['nullable', 'exists:periode,id'],
            'alasan'                 => ['required', 'string', 'max:500'],
            'bypassed_requirements'  => ['nullable', 'array'],
            'bypassed_requirements.*' => ['string', 'in:min_sks,min_gpa,bta_ppi,documents,personal_status,program_prodi'],
        ]);

        $validated['granted_by'] = auth()->id();
        $validated['is_active']  = true;

        $dispensasi = DispensasiKkn::create($validated);

        return $this->created(['id' => $dispensasi->id], "Dispensasi untuk NIM {$validated['nim']} berhasil ditambahkan.");
    }

    public function destroy(DispensasiKkn $dispensasi): JsonResponse
    {
        $nim = $dispensasi->nim;
        $dispensasi->update(['is_active' => false]);

        return $this->noContent("Dispensasi NIM {$nim} telah dicabut.");
    }
}
