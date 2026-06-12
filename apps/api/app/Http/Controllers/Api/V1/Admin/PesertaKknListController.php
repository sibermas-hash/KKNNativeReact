<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Exports\PesertaKknFullExport;
use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaKkn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class PesertaKknListController extends Controller
{
    use ApiResponse;

    private function facultyScopeId(): ?int
    {
        $user = auth()->user();

        return $user?->hasRole('faculty_admin') && $user->fakultas_id
            ? (int) $user->fakultas_id
            : null;
    }

    private function scopeByFaculty($query): void
    {
        if ($facultyId = $this->facultyScopeId()) {
            $query->whereHas('mahasiswa', fn ($m) => $m->where('fakultas_id', $facultyId));
        }
    }

    /**
     * List peserta KKN final (approved, interview_passed, completed).
     */
    public function index(Request $request): JsonResponse
    {
        $query = PesertaKkn::with(['mahasiswa.prodi', 'mahasiswa.fakultas', 'mahasiswa.externalUniversity', 'periode.jenisKkn', 'periode.tahunAkademik', 'kelompok'])
            ->whereIn('status', ['approved', 'interview_passed', 'completed'])
            ->whereHas('periode', fn ($p) => $p->where('is_active', true))
            ->when($request->input('angkatan'), fn ($q, $a) => $q->whereHas('periode', fn ($p) => $p->where('periode', $a)))
            ->when($request->input('periode_id'), fn ($q, $id) => $q->where('periode_id', $id))
            ->when($request->input('academic_year_id'), fn ($q, $id) => $q->whereHas('periode', fn ($p) => $p->where('academic_year_id', $id)))
            ->when($request->input('origin_type'), fn ($q, $ot) => $q->whereHas('mahasiswa', fn ($m) => $m->where('origin_type', $ot)))
            ->when($request->input('search'), function ($q, $search) {
                $term = trim((string) $search);
                $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $term);
                $q->whereHas('mahasiswa', function ($m) use ($term, $escaped) {
                    $m->where('nama', 'ilike', "%{$escaped}%");
                    if (preg_match('/^\d{6,20}$/', $term)) {
                        $m->orWhere('nim_bidx', Mahasiswa::computeBlindIndex($term));
                    }
                });
            })
            ->when($request->input('jenis_kkn_id'), fn ($q, $id) => $q->whereHas('periode', fn ($p) => $p->where('jenis_kkn_id', $id)))
            ->when($request->input('fakultas_id'), fn ($q, $id) => $q->whereHas('mahasiswa', fn ($m) => $m->where('fakultas_id', $id)))
            ->when($request->input('prodi_id'), fn ($q, $id) => $q->whereHas('mahasiswa', fn ($m) => $m->where('prodi_id', $id)))
            ->when($request->input('external_university_id'), fn ($q, $id) => $q->whereHas('mahasiswa', fn ($m) => $m->where('external_university_id', $id)))
            ->orderBy('id');

        $this->scopeByFaculty($query);

        $paginated = $query->paginate($request->integer('per_page', 25));

        return $this->success([
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'last_page' => $paginated->lastPage(),
            ],
        ]);
    }

    public function export(Request $request)
    {
        $query = PesertaKkn::with(['mahasiswa.user', 'mahasiswa.prodi', 'mahasiswa.fakultas', 'mahasiswa.externalUniversity', 'periode.jenisKkn', 'periode.tahunAkademik', 'kelompok'])
            ->whereIn('status', ['approved', 'interview_passed', 'completed'])
            ->whereHas('periode', fn ($p) => $p->where('is_active', true))
            ->when($request->input('angkatan'), fn ($q, $a) => $q->whereHas('periode', fn ($p) => $p->where('periode', $a)))
            ->when($request->input('periode_id'), fn ($q, $id) => $q->where('periode_id', $id))
            ->when($request->input('academic_year_id'), fn ($q, $id) => $q->whereHas('periode', fn ($p) => $p->where('academic_year_id', $id)))
            ->when($request->input('origin_type'), fn ($q, $ot) => $q->whereHas('mahasiswa', fn ($m) => $m->where('origin_type', $ot)))
            ->when($request->input('jenis_kkn_id'), fn ($q, $id) => $q->whereHas('periode', fn ($p) => $p->where('jenis_kkn_id', $id)))
            ->when($request->input('fakultas_id'), fn ($q, $id) => $q->whereHas('mahasiswa', fn ($m) => $m->where('fakultas_id', $id)))
            ->when($request->input('prodi_id'), fn ($q, $id) => $q->whereHas('mahasiswa', fn ($m) => $m->where('prodi_id', $id)))
            ->when($request->input('external_university_id'), fn ($q, $id) => $q->whereHas('mahasiswa', fn ($m) => $m->where('external_university_id', $id)))
            ->orderBy('id')
            ->limit(min($request->integer('limit', 50000), 50000));

        $this->scopeByFaculty($query);

        $index = 1;
        $rows = $query->get()->map(fn (PesertaKkn $p) => [
            'no' => $index++,
            'nim' => $p->mahasiswa?->nim ? (int) $p->mahasiswa->nim : null,
            'nama' => $p->mahasiswa?->nama,
            'prodi' => $p->mahasiswa?->prodi?->nama ?? $p->mahasiswa?->external_prodi_name ?? '-',
            'jenis_kkn' => $p->periode?->jenisKkn?->name ?? '-',
        ])->values();

        return Excel::download(new PesertaKknFullExport($rows), 'peserta-kkn-final-'.now()->format('Ymd-His').'.xlsx');
    }
}
