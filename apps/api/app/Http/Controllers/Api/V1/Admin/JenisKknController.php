<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\JenisKknResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\JenisKkn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JenisKknController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        return $this->success(JenisKknResource::collection(JenisKkn::ordered()->get()));
    }

    public function show(JenisKkn $jenisKkn): JsonResponse
    {
        return $this->success(new JenisKknResource($jenisKkn));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:jenis_kkn,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'registration_mode' => ['required', 'string', 'in:open,selective,proposal_based'],
            'placement_mode' => ['required', 'string', 'in:automatic_after_approval,manual_admin,host_defined,proposal_defined,self_determined'],
            'color' => ['nullable', 'string', 'max:20'],
            'is_active' => ['nullable', 'boolean'],
        ]);
        return $this->created(new JenisKknResource(JenisKkn::create($validated)), 'Jenis KKN berhasil dibuat.');
    }

    public function update(Request $request, JenisKkn $jenisKkn): JsonResponse
    {
        $jenisKkn->update($request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'registration_mode' => ['sometimes', 'string', 'in:open,selective,proposal_based'],
            'placement_mode' => ['sometimes', 'string', 'in:automatic_after_approval,manual_admin,host_defined,proposal_defined,self_determined'],
            'color' => ['nullable', 'string', 'max:20'],
            'is_active' => ['nullable', 'boolean'],
        ]));
        return $this->success(new JenisKknResource($jenisKkn->refresh()), 'Jenis KKN berhasil diperbarui.');
    }

    public function destroy(JenisKkn $jenisKkn): JsonResponse
    {
        try {
            $jenisKkn->delete();
            return $this->noContent('Jenis KKN berhasil dihapus.');
        } catch (\Throwable $e) {
            return $this->error('VALIDATION_ERROR', 'Gagal menghapus: masih digunakan oleh periode.', 422);
        }
    }
}
