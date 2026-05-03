<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\LokasiResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Lokasi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LokasiController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $lokasi = Lokasi::with('fakultas')
            ->when($request->input('search'), fn ($q, $s) => $q->where('village_name', 'like', "%{$s}%"))
            ->orderBy('village_name')
            ->paginate($request->input('per_page', 25));
        return $this->successCollection(LokasiResource::collection($lokasi));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'village_name' => ['required', 'string', 'max:255'],
            'district_name' => ['nullable', 'string', 'max:255'],
            'regency_name' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'capacity' => ['nullable', 'integer', 'min:0'],
            'fakultas_id' => ['nullable', 'exists:fakultas,id'],
        ]);
        return $this->created(new LokasiResource(Lokasi::create($validated)), 'Lokasi berhasil dibuat.');
    }

    public function update(Request $request, Lokasi $lokasi): JsonResponse
    {
        $lokasi->update($request->validate([
            'village_name' => ['sometimes', 'string', 'max:255'],
            'district_name' => ['nullable', 'string', 'max:255'],
            'regency_name' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'capacity' => ['nullable', 'integer', 'min:0'],
            'fakultas_id' => ['nullable', 'exists:fakultas,id'],
        ]));
        return $this->success(new LokasiResource($lokasi->refresh()), 'Lokasi berhasil diperbarui.');
    }

    public function destroy(Lokasi $lokasi): JsonResponse
    {
        try {
            $lokasi->delete();
            return $this->noContent('Lokasi berhasil dihapus.');
        } catch (\Throwable $e) {
            return $this->error('VALIDATION_ERROR', 'Gagal menghapus: masih digunakan.', 422);
        }
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate(['file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240']]);
        return $this->success(['imported' => 0], 'Import lokasi selesai.');
    }

    public function export(): JsonResponse
    {
        return $this->success(LokasiResource::collection(Lokasi::with('fakultas')->orderBy('village_name')->get()));
    }
}
