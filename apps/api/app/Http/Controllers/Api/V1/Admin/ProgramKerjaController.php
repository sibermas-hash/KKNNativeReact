<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\ProgramKerjaResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\ProgramKerja;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgramKerjaController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();
        $facultyId = $user->hasRole('faculty_admin') ? $user->fakultas_id : null;
        $status = $request->input('status');
        $kelompokId = $request->input('kelompok_id');
        $kategori = $request->input('kategori');
        $search = $request->input('search');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $query = ProgramKerja::query()
            ->with(['kelompok.lokasi', 'latestProposal'])
            ->when($facultyId, fn ($q, $id) => $q->whereHas(
                'kelompok.peserta.mahasiswa',
                fn ($q2) => $q2->where('fakultas_id', $id)
            ))
            ->when($status, fn ($q, $s) => $q->where('status', $s))
            ->when($kelompokId, fn ($q, $id) => $q->where('kelompok_id', $id))
            ->when($kategori, fn ($q, $k) => $q->where('kategori', $k))
            ->when($dateFrom, fn ($q, $d) => $q->whereDate('submitted_at', '>=', $d))
            ->when($dateTo, fn ($q, $d) => $q->whereDate('submitted_at', '<=', $d))
            ->when($search, function ($q, $s) {
                $q->where(function ($qq) use ($s) {
                    $qq->where('title', 'ILIKE', "%{$s}%")
                        ->orWhere('description', 'ILIKE', "%{$s}%")
                        ->orWhereHas('kelompok', fn ($kq) => $kq->where('nama_kelompok', 'ILIKE', "%{$s}%")->orWhere('code', 'ILIKE', "%{$s}%"));
                });
            })
            ->orderByDesc('submitted_at');

        $perPage = min(200, max(10, (int) $request->input('per_page', 25)));
        $paginated = $query->paginate($perPage);

        $statsQ = ProgramKerja::query()
            ->when($facultyId, fn ($q, $id) => $q->whereHas('kelompok.peserta.mahasiswa', fn ($q2) => $q2->where('fakultas_id', $id)));

        return $this->success([
            'data' => ProgramKerjaResource::collection($paginated->items())->resolve(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'from' => $paginated->firstItem(),
                'to' => $paginated->lastItem(),
            ],
            'stats' => [
                'total' => (clone $statsQ)->count(),
                'approved' => (clone $statsQ)->where('status', 'approved')->count(),
                'pending' => (clone $statsQ)->where('status', 'pending')->count(),
                'revision' => (clone $statsQ)->where('status', 'revision')->count(),
                'rejected' => (clone $statsQ)->where('status', 'rejected')->count(),
                'with_proposal' => (clone $statsQ)->has('proposals')->count(),
                'kategori' => (clone $statsQ)->selectRaw('kategori, count(*) as c')->groupBy('kategori')->get()->mapWithKeys(fn ($r) => [(string) ($r->kategori ?? 'lain') => (int) $r->c])->all(),
                'abcd' => (clone $statsQ)->whereNotNull('abcd_stage')->selectRaw('abcd_stage, count(*) as c')->groupBy('abcd_stage')->get()->mapWithKeys(fn ($r) => [(string) $r->abcd_stage => (int) $r->c])->all(),
            ],
        ]);
    }
}
