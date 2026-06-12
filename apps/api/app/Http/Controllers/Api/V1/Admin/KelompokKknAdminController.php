<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\KelompokKknResource;
use App\Http\Traits\ApiResponse;
use App\Imports\KelompokKknImport;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Periode;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class KelompokKknAdminController extends Controller
{
    use ApiResponse;

    /**
     * Audit R11-FAC-001 fix: faculty_admin hanya boleh lihat kelompok yang
     * berisi ≥1 mahasiswa dari fakultas mereka (read-only). Write operations
     * seperti store/update/destroy/import tetap dilarang untuk faculty_admin
     * — konsisten dengan PesertaKknController.
     */
    private function facultyScopeId(): ?int
    {
        $user = auth()->user();
        if ($user?->hasRole('faculty_admin') && $user->fakultas_id) {
            return (int) $user->fakultas_id;
        }

        return null;
    }

    private function scopeByFaculty(Builder $query): void
    {
        $facultyId = $this->facultyScopeId();
        if ($facultyId !== null) {
            $query->whereHas('peserta.mahasiswa', fn ($q) => $q->where('fakultas_id', $facultyId));
        }
    }

    private function canReadKelompok(KelompokKkn $kelompok): bool
    {
        $facultyId = $this->facultyScopeId();
        if ($facultyId === null) {
            return true; // superadmin/admin boleh semua
        }

        return $kelompok->peserta()
            ->whereHas('mahasiswa', fn ($q) => $q->where('fakultas_id', $facultyId))
            ->exists();
    }

    private function denyWriteForFacultyAdmin(): ?JsonResponse
    {
        if (auth()->user()?->hasRole('faculty_admin')) {
            return $this->error('FORBIDDEN', 'Admin fakultas hanya memiliki akses baca (read-only).', 403);
        }

        return null;
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = max(1, min((int) $request->integer('per_page', 25), 100));
        $search = trim((string) $request->input('search', ''));

        $query = KelompokKkn::with(['lokasi', 'dosen', 'periode'])
            ->withCount('peserta')
            ->whereHas('periode', fn ($p) => $p->where('is_active', true))
            ->when($request->input('periode_id'), fn ($q, $id) => $q->where('periode_id', $id))
            ->when($search !== '', function ($q) use ($search): void {
                $q->where(function ($qq) use ($search): void {
                    $qq->where('code', 'like', "%{$search}%")
                        ->orWhere('nama_kelompok', 'like', "%{$search}%")
                        ->orWhere('lokasi_manual', 'like', "%{$search}%")
                        ->orWhereHas('lokasi', fn ($l) => $l
                            ->where('village_name', 'like', "%{$search}%")
                            ->orWhere('district_name', 'like', "%{$search}%")
                            ->orWhere('regency_name', 'like', "%{$search}%"));
                });
            })
            ->orderByDesc('created_at');

        $this->scopeByFaculty($query);

        return $this->successCollection(KelompokKknResource::collection($query->paginate($perPage)));
    }

    public function show(KelompokKkn $kelompok): JsonResponse
    {
        if (! $this->canReadKelompok($kelompok)) {
            return $this->error('FORBIDDEN', 'Anda tidak memiliki akses ke kelompok ini.', 403);
        }

        $kelompok->load(['lokasi', 'dosen', 'periode', 'peserta.mahasiswa.user', 'posko']);

        return $this->success(new KelompokKknResource($kelompok));
    }

    public function store(Request $request): JsonResponse
    {
        if ($deny = $this->denyWriteForFacultyAdmin()) {
            return $deny;
        }

        $validated = $request->validate([
            'periode_id' => ['required', 'exists:periode,id'],
            'location_id' => ['nullable', 'exists:lokasi,id'],
            'lokasi_manual' => ['nullable', 'string', 'max:255'],
            'nama_kelompok' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50'],
            'capacity' => ['nullable', 'integer', 'min:1'],
        ]);

        if (! Periode::whereKey($validated['periode_id'])->where('is_active', true)->exists()) {
            return $this->error('INVALID_PERIOD', 'Kelompok hanya boleh dibuat pada periode aktif.', 422);
        }

        return $this->created(new KelompokKknResource(KelompokKkn::create($validated)->load(['lokasi', 'periode'])), 'Kelompok berhasil dibuat.');
    }

    public function update(Request $request, KelompokKkn $kelompok): JsonResponse
    {
        if ($deny = $this->denyWriteForFacultyAdmin()) {
            return $deny;
        }

        $kelompok->update($request->validate([
            'nama_kelompok' => ['sometimes', 'string', 'max:255'],
            'location_id' => ['nullable', 'exists:lokasi,id'],
            'lokasi_manual' => ['nullable', 'string', 'max:255'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'status' => ['nullable', 'string'],
        ]));

        return $this->success(new KelompokKknResource($kelompok->refresh()), 'Kelompok berhasil diperbarui.');
    }

    public function destroy(KelompokKkn $kelompok): JsonResponse
    {
        if ($deny = $this->denyWriteForFacultyAdmin()) {
            return $deny;
        }

        if ($kelompok->peserta()->where('status', 'approved')->exists()) {
            return $this->error('VALIDATION_ERROR', 'Kelompok masih memiliki peserta aktif.', 422);
        }
        $kelompok->delete();

        return $this->noContent('Kelompok berhasil dihapus.');
    }

    public function import(Request $request): JsonResponse
    {
        if ($deny = $this->denyWriteForFacultyAdmin()) {
            return $deny;
        }

        $request->validate(['file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240']]);

        $import = new KelompokKknImport;
        Excel::import($import, $request->file('file'));

        return $this->success([
            'created' => $import->createdCount,
            'updated' => $import->updatedCount,
            'skipped' => $import->skippedCount,
            'errors' => $import->errors,
        ], "Import selesai: {$import->createdCount} dibuat, {$import->updatedCount} diperbarui.");
    }

    /**
     * Daftar mahasiswa dalam kelompok (endpoint terpisah untuk tabel).
     * Faculty-scoped: faculty_admin hanya lihat mahasiswa dari fakultasnya.
     */
    public function mahasiswaList(KelompokKkn $kelompok): JsonResponse
    {
        if (! $this->canReadKelompok($kelompok)) {
            return $this->error('FORBIDDEN', 'Anda tidak memiliki akses ke kelompok ini.', 403);
        }

        $facultyId = $this->facultyScopeId();
        $peserta = $kelompok->peserta()
            ->with(['mahasiswa.user', 'mahasiswa.prodi.fakultas'])
            ->when($facultyId, fn ($q, $fid) => $q->whereHas('mahasiswa', fn ($qq) => $qq->where('fakultas_id', $fid)))
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'mahasiswa_id' => $p->mahasiswa?->id,
                'nim' => $p->mahasiswa?->nim,
                'nama' => $p->mahasiswa?->nama,
                'prodi' => $p->mahasiswa?->prodi?->name,
                'fakultas' => $p->mahasiswa?->prodi?->fakultas?->name,
                'role' => $p->role,
                'status' => $p->status,
            ]);

        return $this->success(['mahasiswa' => $peserta, 'total' => $peserta->count()]);
    }
}
