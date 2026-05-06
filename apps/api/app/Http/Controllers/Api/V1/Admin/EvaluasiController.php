<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Evaluasi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EvaluasiController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $evaluasi = Evaluasi::with(['mahasiswa.user', 'kelompok', 'item'])
            ->when($request->input('periode_id'), fn ($q, $id) => $q->whereHas('kelompok', fn ($q2) => $q2->where('periode_id', $id)))
            ->when($request->input('kelompok_id'), fn ($q, $id) => $q->where('kelompok_id', $id))
            ->latest()
            ->paginate($request->input('per_page', 25));

        return $this->success([
            'data' => $evaluasi->items(),
            'meta' => [
                'current_page' => $evaluasi->currentPage(),
                'last_page' => $evaluasi->lastPage(),
                'per_page' => $evaluasi->perPage(),
                'total' => $evaluasi->total(),
            ],
        ]);
    }
}
