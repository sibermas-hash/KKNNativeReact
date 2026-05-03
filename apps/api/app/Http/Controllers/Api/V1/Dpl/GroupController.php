<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Dpl;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\KelompokKknResource;
use App\Http\Resources\Api\V1\KegiatanKknResource;
use App\Http\Resources\Api\V1\LaporanAkhirResource;
use App\Http\Resources\Api\V1\NilaiKknResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\LaporanAkhir;
use App\Models\KKN\NilaiKkn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GroupController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $dosen = auth()->user()->dosen;
        if (! $dosen) {
            return $this->success(['groups' => []]);
        }

        $groupIds = $dosen->kelompokKkn()->pluck('kelompok_kkn.id');

        $kelompok = KelompokKkn::whereIn('id', $groupIds)
            ->with(['periode', 'lokasi'])
            ->withCount(['peserta', 'kegiatan', 'programKerja'])
            ->get();

        return $this->success([
            'groups' => $kelompok->map(fn ($g) => [
                'id' => $g->id,
                'code' => $g->code,
                'name' => $g->nama_kelompok,
                'status' => $g->status,
                'member_count' => $g->peserta_count,
                'daily_report_count' => $g->kegiatan_count,
                'work_program_count' => $g->program_kerja_count,
                'period_name' => $g->periode?->name ?? '-',
                'village_name' => $g->lokasi?->village_name ?? '-',
            ])->values(),
        ]);
    }

    public function show(KelompokKkn $group): JsonResponse
    {
        $dosen = auth()->user()->dosen;
        if (! $dosen) {
            return $this->forbidden();
        }

        $groupIds = $dosen->kelompokKkn()->pluck('kelompok_kkn.id');
        if (! $groupIds->contains($group->id)) {
            return $this->forbidden('Anda tidak memiliki akses ke kelompok ini.');
        }

        $group->load([
            'periode', 'lokasi',
            'peserta.mahasiswa.fakultas',
            'peserta.mahasiswa.prodi',
            'peserta.mahasiswa.nilai' => fn ($q) => $q->where('kelompok_id', $group->id),
            'programKerja',
            'posko',
        ]);

        return $this->success([
            'id' => $group->id,
            'code' => $group->code,
            'name' => $group->nama_kelompok,
            'status' => $group->status,
            'capacity' => $group->capacity,
            'period_name' => $group->periode?->name ?? '-',
            'village_name' => $group->lokasi?->village_name ?? '-',
            'address' => $group->lokasi?->address,
            'members' => $group->peserta->map(fn ($r) => [
                'id' => $r->id,
                'status' => $r->status,
                'role' => $r->role,
                'student' => [
                    'nim' => $r->mahasiswa?->nim ?? '-',
                    'name' => $r->mahasiswa?->nama ?? '-',
                    'faculty_name' => $r->mahasiswa?->fakultas?->nama ?? '-',
                    'program_name' => $r->mahasiswa?->prodi?->nama ?? '-',
                ],
                'nilai' => $r->mahasiswa?->nilai?->first() ? [
                    'id' => $r->mahasiswa->nilai->first()->id,
                    'is_finalized' => (bool) $r->mahasiswa->nilai->first()->is_finalized,
                ] : null,
            ])->values(),
            'work_programs' => $group->programKerja->map(fn ($p) => [
                'id' => $p->id,
                'title' => $p->title,
                'status' => $p->status,
            ])->values(),
            'posko' => $group->posko ? [
                'latitude' => $group->posko->latitude,
                'longitude' => $group->posko->longitude,
                'photo_url' => $group->posko->photo_path ? asset('storage/'.$group->posko->photo_path) : null,
                'updated_at' => $group->posko->updated_at?->format('d M Y H:i'),
            ] : null,
        ]);
    }
}
