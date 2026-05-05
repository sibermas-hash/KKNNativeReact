<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\EvaluasiDplPesertaResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\EvaluasiDplPeserta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DplParticipantEvaluationController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = EvaluasiDplPeserta::with(['mahasiswa.user', 'dosen.user', 'items'])
            ->when($request->input('dosen_id'), fn ($q, $id) => $q->where('dosen_id', $id))
            ->orderByDesc('created_at');

        $evaluations = $query->paginate($request->input('per_page', 25));

        return $this->successCollection(EvaluasiDplPesertaResource::collection($evaluations));
    }
}
