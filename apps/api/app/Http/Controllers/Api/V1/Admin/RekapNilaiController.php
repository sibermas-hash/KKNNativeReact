<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\NilaiKknResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\NilaiKkn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RekapNilaiController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = NilaiKkn::with(['user', 'kelompok.periode'])->when($request->input('periode_id'), fn ($q, $id) => $q->whereHas('kelompok', fn ($q2) => $q2->where('periode_id', $id)))->when($request->input('kelompok_id'), fn ($q, $id) => $q->where('kelompok_id', $id))->orderByDesc('created_at');
        return $this->successCollection(NilaiKknResource::collection($query->paginate(25)));
    }

    public function finalize(NilaiKkn $score): JsonResponse
    {
        $score->update(['is_finalized' => true, 'admin_graded_by' => auth()->id(), 'admin_graded_at' => now()]);
        return $this->success(new NilaiKknResource($score->refresh()), 'Nilai berhasil difinalisasi.');
    }

    public function finalizeMass(Request $request): JsonResponse
    {
        $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer']]);
        $count = NilaiKkn::whereIn('id', $request->input('ids'))->update(['is_finalized' => true, 'admin_graded_by' => auth()->id(), 'admin_graded_at' => now()]);
        return $this->success(['finalized_count' => $count], "{$count} nilai berhasil difinalisasi.");
    }

    public function export(): JsonResponse
    {
        return $this->success(['download_url' => '#'], 'Export rekap nilai.');
    }
}
