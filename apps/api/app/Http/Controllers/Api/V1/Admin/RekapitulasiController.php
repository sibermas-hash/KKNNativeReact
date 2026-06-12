<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\RekapitulasiKegiatan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RekapitulasiController extends Controller
{
    use ApiResponse;

    private function facultyScopeId(): ?int
    {
        $user = auth()->user();

        return $user?->hasRole('faculty_admin') && $user->fakultas_id
            ? (int) $user->fakultas_id
            : null;
    }

    private function scopeGroupsByFaculty($query): void
    {
        if ($facultyId = $this->facultyScopeId()) {
            $query->whereHas('peserta.mahasiswa', fn ($q) => $q->where('fakultas_id', $facultyId));
        }
    }

    private function ensureGroupInFacultyScope(KelompokKkn $group): void
    {
        if ($facultyId = $this->facultyScopeId()) {
            abort_unless(
                $group->peserta()->whereHas('mahasiswa', fn ($q) => $q->where('fakultas_id', $facultyId))->exists(),
                403,
                'Anda tidak memiliki akses ke kelompok ini.'
            );
        }
    }

    public function index(Request $request): JsonResponse
    {
        $kelompokId = $request->integer('kelompok_id');

        if ($kelompokId) {
            $kelompok = KelompokKkn::with(['lokasi', 'periode', 'dosen'])->findOrFail($kelompokId);
            $this->ensureGroupInFacultyScope($kelompok);

            $rekapitulasi = RekapitulasiKegiatan::where('kelompok_id', $kelompokId)
                ->orderBy('uraian_kegiatan')
                ->get();

            return $this->success([
                'kelompok' => [
                    'id' => $kelompok->id,
                    'nama_kelompok' => $kelompok->nama_kelompok,
                    'lokasi' => $kelompok->lokasi ? [
                        'village_name' => $kelompok->lokasi->village_name,
                        'district_name' => $kelompok->lokasi->district_name,
                        'regency_name' => $kelompok->lokasi->regency_name,
                    ] : null,
                    'periode' => $kelompok->periode ? ['name' => $kelompok->periode->name] : null,
                ],
                'rekapitulasi' => $rekapitulasi,
                'dpl' => $kelompok->dosen ? ['nama' => $kelompok->dosen->nama] : null,
            ]);
        }

        // Daftar semua kelompok yang punya rekapitulasi
        $kelompokList = KelompokKkn::with(['lokasi', 'periode'])
            ->whereHas('rekapitulasiKegiatan');

        $this->scopeGroupsByFaculty($kelompokList);

        $kelompokList = $kelompokList->orderBy('nama_kelompok')
            ->get()
            ->map(fn ($k) => [
                'id' => $k->id,
                'nama_kelompok' => $k->nama_kelompok,
                'desa' => $k->lokasi?->village_name,
                'kecamatan' => $k->lokasi?->district_name,
                'periode' => $k->periode?->name,
                'total_dana' => $k->rekapitulasiKegiatan()->sum('jumlah'),
                'jumlah_kegiatan' => $k->rekapitulasiKegiatan()->count(),
            ]);

        return $this->success(['kelompok_list' => $kelompokList]);
    }
}
