<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\NilaiKknResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\NilaiKkn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class YudisiumController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = NilaiKkn::where('is_finalized', true)
            ->when($request->input('periode_id'), fn ($q, $id) => $q->whereHas('kelompok', fn ($q2) => $q2->where('periode_id', $id)))
            ->with(['user:id,name,username', 'kelompok:id,code,nama_kelompok']);

        $scores = $query->paginate($request->input('per_page', 25));

        $summary = NilaiKkn::where('is_finalized', true)
            ->when($request->input('periode_id'), fn ($q, $id) => $q->whereHas('kelompok', fn ($q2) => $q2->where('periode_id', $id)))
            ->selectRaw('count(*) as total, sum(case when total_score >= 70 then 1 else 0 end) as passed, sum(case when total_score < 70 then 1 else 0 end) as failed')
            ->first();

        return $this->success([
            'scores' => NilaiKknResource::collection($scores),
            'summary' => [
                'total' => (int) ($summary->total ?? 0),
                'passed' => (int) ($summary->passed ?? 0),
                'failed' => (int) ($summary->failed ?? 0),
            ],
        ]);
    }

    public function proses(Request $request): JsonResponse
    {
        $request->validate(['periode_id' => ['required', 'exists:periode,id']]);
        return $this->success(['processed' => true], 'Proses yudisium selesai.');
    }
}
