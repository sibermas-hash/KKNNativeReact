<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\KonfigurasiPenilaian;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KonfigurasiPenilaianController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        return $this->success(['config' => KonfigurasiPenilaian::when($request->input('periode_id'), fn ($q, $id) => $q->where('periode_id', $id))->first()]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate(['periode_id' => ['required', 'exists:periode,id'], 'dpl_weight' => ['nullable', 'numeric'], 'village_weight' => ['nullable', 'numeric'], 'lppm_weight' => ['nullable', 'numeric']]);
        return $this->success(['config' => KonfigurasiPenilaian::updateOrCreate(['periode_id' => $validated['periode_id']], $validated)], 'Konfigurasi penilaian berhasil diperbarui.');
    }
}
