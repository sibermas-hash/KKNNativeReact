<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\KegiatanKknResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\KegiatanKkn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KegiatanKknAdminController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = KegiatanKkn::with(['mahasiswa.user', 'kelompok', 'fileKegiatan'])->when($request->input('kelompok_id'), fn ($q, $id) => $q->where('kelompok_id', $id))->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))->orderByDesc('date');
        return $this->successCollection(KegiatanKknResource::collection($query->paginate(25)));
    }

    public function show(KegiatanKkn $dailyReport): JsonResponse
    {
        $dailyReport->load(['mahasiswa.user', 'kelompok.lokasi', 'fileKegiatan']);
        return $this->success(new KegiatanKknResource($dailyReport));
    }
}
