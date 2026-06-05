<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Helpers\QueryHelper;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\LokasiResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LokasiController extends Controller
{
    use ApiResponse;

    private const TARGET_REGENCIES = ['Banyumas', 'Banjarnegara', 'Kebumen', 'Purbalingga', 'Pangandaran'];

    private function facultyScopeId(): ?int
    {
        $user = auth()->user();

        return $user?->hasRole('faculty_admin') && $user->fakultas_id
            ? (int) $user->fakultas_id
            : null;
    }

    private function denyFacultyAdminMutation(): void
    {
        abort_if($this->facultyScopeId(), 403, 'Admin fakultas hanya memiliki akses baca untuk data lokasi.');
    }

    private function scopeByFaculty($query): void
    {
        if ($facultyId = $this->facultyScopeId()) {
            $query->where(function ($q) use ($facultyId) {
                $q->whereNull('fakultas_id')->orWhere('fakultas_id', $facultyId);
            });
        }
    }

    public function index(Request $request): JsonResponse
    {
        $lokasi = Lokasi::with('fakultas')
            ->whereIn('regency_name', self::TARGET_REGENCIES)
            ->when($request->input('search'), fn ($q, $s) => $q->where('village_name', 'like', '%'.QueryHelper::escapeLike($s).'%'))
            ->orderBy('village_name');

        $this->scopeByFaculty($lokasi);

        $lokasi = $lokasi->paginate($request->input('per_page', 25));

        return $this->successCollection(LokasiResource::collection($lokasi));
    }

    public function updateSelection(Request $request): JsonResponse
    {
        $this->denyFacultyAdminMutation();

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:lokasi,id'],
            'is_selected_for_kkn' => ['required', 'boolean'],
        ]);

        $updated = Lokasi::whereIn('id', $validated['ids'])
            ->whereIn('regency_name', self::TARGET_REGENCIES)
            ->update(['is_selected_for_kkn' => (bool) $validated['is_selected_for_kkn']]);

        return $this->success(['updated' => $updated], 'Pilihan lokasi berhasil disimpan.');
    }

    public function store(Request $request): JsonResponse
    {
        $this->denyFacultyAdminMutation();

        $validated = $request->validate([
            'village_name' => ['required', 'string', 'max:255'],
            'district_name' => ['nullable', 'string', 'max:255'],
            'regency_name' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'capacity' => ['nullable', 'integer', 'min:0'],
            'fakultas_id' => ['nullable', 'exists:fakultas,id'],
            'is_selected_for_kkn' => ['sometimes', 'boolean'],
        ]);

        return $this->created(new LokasiResource(Lokasi::create($validated)), 'Lokasi berhasil dibuat.');
    }

    public function update(Request $request, Lokasi $lokasi): JsonResponse
    {
        $this->denyFacultyAdminMutation();

        $lokasi->update($request->validate([
            'village_name' => ['sometimes', 'string', 'max:255'],
            'district_name' => ['nullable', 'string', 'max:255'],
            'regency_name' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'capacity' => ['nullable', 'integer', 'min:0'],
            'fakultas_id' => ['nullable', 'exists:fakultas,id'],
            'is_selected_for_kkn' => ['sometimes', 'boolean'],
        ]));

        return $this->success(new LokasiResource($lokasi->refresh()), 'Lokasi berhasil diperbarui.');
    }

    public function destroy(Lokasi $lokasi): JsonResponse
    {
        $this->denyFacultyAdminMutation();

        // Audit R11-GROUP-018 fix: block delete kalau ada kelompok yang
        // masih mereferensikan lokasi ini. Sebelumnya delete langsung
        // (dan FK cascadeOnDelete akan menghapus kelompok + peserta terkait
        // — data loss silent). Sekarang return 422 dengan info berapa
        // kelompok terkait supaya admin pindahkan dulu.
        $groupsUsing = KelompokKkn::where('location_id', $lokasi->id)->count();
        if ($groupsUsing > 0) {
            return $this->error(
                'VALIDATION_ERROR',
                "Lokasi tidak dapat dihapus: masih digunakan oleh {$groupsUsing} kelompok KKN. Pindahkan kelompok ke lokasi lain terlebih dahulu.",
                422,
            );
        }

        try {
            $lokasi->delete();

            return $this->noContent('Lokasi berhasil dihapus.');
        } catch (\Throwable $e) {
            return $this->error('VALIDATION_ERROR', 'Gagal menghapus: '.$e->getMessage(), 422);
        }
    }

    public function import(Request $request): JsonResponse
    {
        $this->denyFacultyAdminMutation();

        $request->validate(['file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240']]);

        return $this->success(['imported' => 0], 'Import lokasi selesai.');
    }

    public function export(): JsonResponse
    {
        $query = Lokasi::with('fakultas')->orderBy('village_name');
        $this->scopeByFaculty($query);

        return $this->success(LokasiResource::collection($query->get()));
    }

    public function regulerPool(Request $request): JsonResponse
    {
        $lokasi = Lokasi::query()
            ->with('fakultas')
            ->when($request->input('search'), fn ($q, $s) => $q->where('village_name', 'like', '%'.QueryHelper::escapeLike($s).'%'))
            ->orderBy('village_name');

        $this->scopeByFaculty($lokasi);

        $lokasi = $lokasi->get();

        return $this->success(LokasiResource::collection($lokasi));
    }
}
