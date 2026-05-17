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
        $validated = $request->validate([
            'year' => ['required', 'string', 'max:20', 'unique:tahun_akademik,year'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if (TahunAkademik::where('is_active', true)->doesntExist()) {
            $validated['is_active'] = true;
        }

        return $this->created(new TahunAkademikResource(TahunAkademik::create($validated)), 'Tahun akademik berhasil dibuat.');
    }

    public function update(Request $request, TahunAkademik $tahunAkademik): JsonResponse
    {
        $validated = $request->validate([
            'year' => ['sometimes', 'string', 'max:20', 'unique:tahun_akademik,year,'.$tahunAkademik->id],
            'is_active' => ['nullable', 'boolean'],
        ]);

        // Proteksi: tidak boleh menonaktifkan satu-satunya tahun aktif
        if ($tahunAkademik->is_active && isset($validated['is_active']) && ! $validated['is_active']) {
            if (TahunAkademik::where('is_active', true)->count() <= 1) {
                return $this->error('VALIDATION_ERROR', 'Sistem memerlukan minimal satu tahun akademik yang aktif.', 422);
            }
        }

        $tahunAkademik->update($validated);

        return $this->success(new TahunAkademikResource($tahunAkademik->refresh()), 'Tahun akademik berhasil diperbarui.');
    }

    public function destroy(TahunAkademik $tahunAkademik): JsonResponse
    {
        // Proteksi: tidak boleh hapus jika ada periode terkait
        if ($tahunAkademik->periode()->exists()) {
            return $this->error('VALIDATION_ERROR', 'Tidak dapat menghapus: tahun akademik ini masih memiliki data periode KKN.', 422);
        }

        // Proteksi: tidak boleh hapus tahun yang sedang aktif
        if ($tahunAkademik->is_active) {
            return $this->error('VALIDATION_ERROR', 'Tidak dapat menghapus tahun akademik yang sedang aktif.', 422);
        }

        $tahunAkademik->delete();

        return $this->noContent('Tahun akademik berhasil dihapus.');
    }
}
