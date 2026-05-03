<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\TahunAkademikResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\TahunAkademik;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TahunAkademikController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        return $this->success(TahunAkademikResource::collection(TahunAkademik::orderByDesc('year')->get()));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate(['year' => ['required', 'string', 'max:20'], 'is_active' => ['nullable', 'boolean']]);
        return $this->created(new TahunAkademikResource(TahunAkademik::create($validated)), 'Tahun akademik berhasil dibuat.');
    }

    public function update(Request $request, TahunAkademik $tahunAkademik): JsonResponse
    {
        $tahunAkademik->update($request->validate(['year' => ['sometimes', 'string', 'max:20'], 'is_active' => ['nullable', 'boolean']]));
        return $this->success(new TahunAkademikResource($tahunAkademik->refresh()), 'Tahun akademik berhasil diperbarui.');
    }

    public function destroy(TahunAkademik $tahunAkademik): JsonResponse
    {
        $tahunAkademik->delete();
        return $this->noContent('Tahun akademik berhasil dihapus.');
    }
}
