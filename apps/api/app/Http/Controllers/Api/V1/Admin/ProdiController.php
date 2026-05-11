<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\ProdiResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Prodi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProdiController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $prodi = Prodi::with('fakultas')->when($request->input('fakultas_id'), fn ($q, $id) => $q->where('fakultas_id', $id))->orderBy('nama')->get();

        return $this->success(ProdiResource::collection($prodi));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate(['fakultas_id' => ['required', 'exists:fakultas,id'], 'nama' => ['required', 'string', 'max:255'], 'code' => ['required', 'string', 'max:20', 'unique:prodi,code']]);

        return $this->created(new ProdiResource(Prodi::create($validated)->load('fakultas')), 'Prodi berhasil dibuat.');
    }

    public function update(Request $request, Prodi $prodi): JsonResponse
    {
        $prodi->update($request->validate(['nama' => ['sometimes', 'string', 'max:255'], 'code' => ['sometimes', 'string', 'max:20']]));

        return $this->success(new ProdiResource($prodi->refresh()), 'Prodi berhasil diperbarui.');
    }

    public function destroy(Prodi $prodi): JsonResponse
    {
        try {
            $prodi->delete();

            return $this->noContent('Prodi berhasil dihapus.');
        } catch (\Throwable $e) {
            return $this->error('VALIDATION_ERROR', 'Gagal menghapus: masih digunakan.', 422);
        }
    }
}
