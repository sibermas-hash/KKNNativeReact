<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\NilaiKknResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\NilaiKkn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GradeController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = NilaiKkn::with(['user', 'kelompok'])->when($request->input('kelompok_id'), fn ($q, $id) => $q->where('kelompok_id', $id))->orderByDesc('created_at');
        return $this->successCollection(NilaiKknResource::collection($query->paginate(25)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate(['user_id' => ['required', 'exists:users,id'], 'kelompok_id' => ['required', 'exists:kelompok_kkn,id'], 'scores' => ['required', 'array']]);
        return $this->success(new NilaiKknResource(NilaiKkn::updateOrCreate(['user_id' => $validated['user_id'], 'kelompok_id' => $validated['kelompok_id']], array_merge($validated['scores'], ['admin_graded_by' => auth()->id(), 'admin_graded_at' => now()]))), 'Nilai berhasil disimpan.');
    }
}
