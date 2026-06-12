<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\FakultasResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Fakultas;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FakultasController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        return $this->success(FakultasResource::collection(Fakultas::withCount('prodi')->orderBy('nama')->get()));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate(['nama' => ['required', 'string', 'max:255'], 'code' => ['required', 'string', 'max:20', 'unique:fakultas,code']]);

        return $this->created(new FakultasResource(Fakultas::create($validated)), 'Fakultas berhasil dibuat.');
    }

    public function update(Request $request, Fakultas $fakultas): JsonResponse
    {
        $fakultas->update($request->validate(['nama' => ['sometimes', 'string', 'max:255'], 'code' => ['sometimes', 'string', 'max:20']]));

        return $this->success(new FakultasResource($fakultas->refresh()), 'Fakultas berhasil diperbarui.');
    }

    public function destroy(Fakultas $fakultas): JsonResponse
    {
        try {
            $fakultas->delete();

            return $this->noContent('Fakultas berhasil dihapus.');
        } catch (\Throwable $e) {
            return $this->error('VALIDATION_ERROR', 'Gagal menghapus: masih digunakan.', 422);
        }
    }
}
