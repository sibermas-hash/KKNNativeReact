<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\PesertaKkn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
                $q->whereHas('mahasiswa', fn ($m) => $m->where('nim', 'ilike', "%{$search}%")->orWhere('nama', 'ilike', "%{$search}%"));
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
}
