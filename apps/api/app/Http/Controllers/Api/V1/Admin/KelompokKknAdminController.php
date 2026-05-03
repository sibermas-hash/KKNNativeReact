<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\KelompokKknResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\KelompokKkn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KelompokKknAdminController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = KelompokKkn::with(['lokasi', 'dosen', 'periode'])->withCount('peserta')->when($request->input('periode_id'), fn ($q, $id) => $q->where('periode_id', $id))->orderByDesc('created_at');
        return $this->successCollection(KelompokKknResource::collection($query->paginate(25)));
    }

    public function show(KelompokKkn $kelompok): JsonResponse
    {
        $kelompok->load(['lokasi', 'dosen', 'periode', 'peserta.mahasiswa.user', 'posko']);
        return $this->success(new KelompokKknResource($kelompok));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate(['periode_id' => ['required', 'exists:periode,id'], 'location_id' => ['nullable', 'exists:lokasi,id'], 'nama_kelompok' => ['required', 'string', 'max:255'], 'code' => ['required', 'string', 'max:50'], 'capacity' => ['nullable', 'integer', 'min:1']]);
        return $this->created(new KelompokKknResource(KelompokKkn::create($validated)->load(['lokasi', 'periode'])), 'Kelompok berhasil dibuat.');
    }

    public function update(Request $request, KelompokKkn $kelompok): JsonResponse
    {
        $kelompok->update($request->validate(['nama_kelompok' => ['sometimes', 'string', 'max:255'], 'location_id' => ['nullable', 'exists:lokasi,id'], 'capacity' => ['nullable', 'integer', 'min:1'], 'status' => ['nullable', 'string']]));
        return $this->success(new KelompokKknResource($kelompok->refresh()), 'Kelompok berhasil diperbarui.');
    }

    public function destroy(KelompokKkn $kelompok): JsonResponse
    {
        if ($kelompok->peserta()->where('status', 'approved')->exists()) return $this->error('VALIDATION_ERROR', 'Kelompok masih memiliki peserta aktif.', 422);
        $kelompok->delete();
        return $this->noContent('Kelompok berhasil dihapus.');
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate(['file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240']]);
        return $this->success(['imported' => 0], 'Import kelompok selesai.');
    }
}
