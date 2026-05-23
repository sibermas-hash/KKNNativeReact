<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Exports\PesertaKknFullExport;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaKkn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class PesertaKknListController extends Controller
{
    use ApiResponse;

    /**
     * List peserta KKN final (approved, interview_passed, completed).
     */
    public function index(Request $request): JsonResponse
    {
        $query = PesertaKkn::with(['mahasiswa.prodi', 'mahasiswa.fakultas', 'periode.jenisKkn', 'kelompok'])
            ->whereIn('status', ['approved', 'interview_passed', 'completed'])
            ->when($request->input('angkatan'), fn ($q, $a) => $q->whereHas('periode', fn ($p) => $p->where('periode', $a)))
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
            ->orderBy('id');

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
        $query = PesertaKkn::with(['mahasiswa.user', 'mahasiswa.prodi', 'mahasiswa.fakultas', 'periode.jenisKkn', 'kelompok'])
            ->whereIn('status', ['approved', 'interview_passed', 'completed'])
            ->when($request->input('angkatan'), fn ($q, $a) => $q->whereHas('periode', fn ($p) => $p->where('periode', $a)))
            ->when($request->input('jenis_kkn_id'), fn ($q, $id) => $q->whereHas('periode', fn ($p) => $p->where('jenis_kkn_id', $id)))
            ->orderBy('id')
            ->limit(min($request->integer('limit', 50000), 50000));

        $rows = $query->get()->map(fn (PesertaKkn $p) => [
            'registration_id' => $p->id,
            'status_pendaftaran' => $p->status,
            'tanggal_daftar' => $p->registration_date?->toDateTimeString(),
            'approved_at' => $p->approved_at?->toDateTimeString(),
            'nim' => $p->mahasiswa?->nim,
            'nama' => $p->mahasiswa?->nama,
            'email' => $p->mahasiswa?->user?->email,
            'phone' => $p->mahasiswa?->phone ?? $p->mahasiswa?->user?->phone,
            'alamat' => $p->mahasiswa?->alamat ?? $p->mahasiswa?->user?->address,
            'nik' => $p->mahasiswa?->nik,
            'ibu_kandung' => $p->mahasiswa?->mother_name,
            'jenis_kelamin' => $p->mahasiswa?->gender,
            'tempat_lahir' => $p->mahasiswa?->birth_place,
            'tanggal_lahir' => $p->mahasiswa?->birth_date?->toDateString(),
            'status_nikah' => $p->mahasiswa?->marital_status,
            'ukuran_kaos' => $p->mahasiswa?->shirt_size,
            'angkatan' => $p->mahasiswa?->batch_year,
            'semester' => $p->mahasiswa?->semester,
            'sks' => $p->mahasiswa?->sks_completed,
            'ipk' => $p->mahasiswa?->gpa,
            'status_bta_ppi' => $p->mahasiswa?->status_bta_ppi,
            'is_paid_ukt' => $p->mahasiswa?->is_paid_ukt,
            'status_aktif' => $p->mahasiswa?->status_aktif,
            'is_eligible' => $p->mahasiswa?->is_eligible,
            'fakultas_id' => $p->mahasiswa?->fakultas_id,
            'fakultas' => $p->mahasiswa?->fakultas?->nama,
            'prodi_id' => $p->mahasiswa?->prodi_id,
            'prodi' => $p->mahasiswa?->prodi?->nama,
            'periode_id' => $p->periode_id,
            'periode' => $p->periode?->name,
            'jenis_kkn_id' => $p->periode?->jenis_kkn_id,
            'jenis_kkn' => $p->periode?->jenisKkn?->name,
            'kelompok_id' => $p->kelompok_id,
            'kelompok' => $p->kelompok?->nama_kelompok,
            'role_kelompok' => $p->role,
        ])->values();

        return Excel::download(new PesertaKknFullExport($rows), 'peserta-kkn-final-'.now()->format('Ymd-His').'.xlsx');
    }

}
