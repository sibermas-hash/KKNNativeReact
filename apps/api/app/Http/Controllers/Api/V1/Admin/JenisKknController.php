<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\JenisKknResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\JenisKkn;
use App\Services\RedisCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JenisKknController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        return $this->success(JenisKknResource::collection(JenisKkn::with(['documentRequirements.defaultTemplate'])->ordered()->get()));
    }

    public function show(JenisKkn $jenisKkn): JsonResponse
    {
        $jenisKkn->load(['documentRequirements.defaultTemplate']);

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
            'sort_order' => ['nullable', 'integer'],
            'requirements_config' => ['nullable', 'array'],
            'requirements_config.min_sks' => ['nullable', 'integer', 'min:0'],
            'requirements_config.min_gpa' => ['nullable', 'numeric', 'min:0', 'max:4'],
            'requirements_config.min_semester' => ['nullable', 'integer', 'min:0'],
            'requirements_config.require_bta_ppi' => ['nullable', 'boolean'],
            'requirements_config.require_not_married' => ['nullable', 'boolean'],
            'requirements_config.require_parent_permission' => ['nullable', 'boolean'],
            'requirements_config.require_health_cert' => ['nullable', 'boolean'],
            'requirements_config.specific_prodi_ids' => ['nullable', 'array'],
            'requirements_config.specific_prodi_ids.*' => ['integer', 'exists:prodi,id'],
            'attendance_config' => ['nullable', 'array'],
            'attendance_config.geofence_enabled' => ['nullable', 'boolean'],
            'attendance_config.radius_meters' => ['nullable', 'integer', 'min:50', 'max:10000'],
            'attendance_config.location_source' => ['nullable', 'string', 'in:posko,address,custom'],
            'attendance_config.require_photo' => ['nullable', 'boolean'],
            'attendance_config.allow_offline_sync' => ['nullable', 'boolean'],
        ]);
        $jenis = JenisKkn::create($validated);
        RedisCacheService::invalidateMasterData();

        return $this->created(new JenisKknResource($jenis), 'Jenis KKN berhasil dibuat.');
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
            'sort_order' => ['nullable', 'integer'],
            'requirements_config' => ['nullable', 'array'],
            'requirements_config.min_sks' => ['nullable', 'integer', 'min:0'],
            'requirements_config.min_gpa' => ['nullable', 'numeric', 'min:0', 'max:4'],
            'requirements_config.min_semester' => ['nullable', 'integer', 'min:0'],
            'requirements_config.require_bta_ppi' => ['nullable', 'boolean'],
            'requirements_config.require_not_married' => ['nullable', 'boolean'],
            'requirements_config.require_parent_permission' => ['nullable', 'boolean'],
            'requirements_config.require_health_cert' => ['nullable', 'boolean'],
            'requirements_config.specific_prodi_ids' => ['nullable', 'array'],
            'requirements_config.specific_prodi_ids.*' => ['integer', 'exists:prodi,id'],
            'attendance_config' => ['nullable', 'array'],
            'attendance_config.geofence_enabled' => ['nullable', 'boolean'],
            'attendance_config.radius_meters' => ['nullable', 'integer', 'min:50', 'max:10000'],
            'attendance_config.location_source' => ['nullable', 'string', 'in:posko,address,custom'],
            'attendance_config.require_photo' => ['nullable', 'boolean'],
            'attendance_config.allow_offline_sync' => ['nullable', 'boolean'],
        ]));
        RedisCacheService::invalidateMasterData();

        return $this->success(new JenisKknResource($jenisKkn->refresh()), 'Jenis KKN berhasil diperbarui.');
    }

    public function destroy(JenisKkn $jenisKkn): JsonResponse
    {
        $count = $jenisKkn->periodes()->count();
        if ($count > 0) {
            return $this->error('VALIDATION_ERROR', "Tidak dapat menghapus: masih digunakan oleh {$count} periode.", 422);
        }

        $jenisKkn->delete();
        RedisCacheService::invalidateMasterData();

        return $this->noContent('Jenis KKN berhasil dihapus.');
    }
}
