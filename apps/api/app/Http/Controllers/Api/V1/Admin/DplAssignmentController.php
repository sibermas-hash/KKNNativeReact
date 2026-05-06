<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\DplPeriodResource;
use App\Http\Resources\Api\V1\DosenResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Dosen;
use App\Models\KKN\DplKecamatanAssignment;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\KelompokKkn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DplAssignmentController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = DplPeriod::with(['dosen.user', 'dosen.fakultas', 'periode', 'kelompok'])->when($request->input('periode_id'), fn ($q, $id) => $q->where('periode_id', $id))->orderByDesc('created_at');
        return $this->successCollection(DplPeriodResource::collection($query->paginate(25)));
    }

    public function assignToPeriod(Request $request): JsonResponse
    {
        $validated = $request->validate(['dosen_id' => ['required', 'exists:dosen,id'], 'periode_id' => ['required', 'exists:periode,id'], 'max_groups' => ['required', 'integer', 'min:1', 'max:20']]);
        return $this->created(new DplPeriodResource(DplPeriod::create(['dosen_id' => $validated['dosen_id'], 'periode_id' => $validated['periode_id'], 'max_kelompok_kkn' => $validated['max_groups'], 'is_active' => true, 'status' => 'active', 'approved_at' => now(), 'approved_by' => auth()->id()])->load(['dosen', 'periode'])), 'DPL berhasil ditugaskan ke periode.');
    }

    public function assignToGroup(Request $request, KelompokKkn $group): JsonResponse
    {
        $request->validate(['dpl_period_id' => ['required', 'exists:dpl_periode,id']]);
        $dplPeriod = DplPeriod::findOrFail($request->input('dpl_period_id'));
        $group->dosen()->attach($dplPeriod->dosen_id, ['role' => 'Ketua']);
        $group->syncKetuaFlatColumns();
        return $this->success(new \App\Http\Resources\Api\V1\KelompokKknResource($group->refresh()->load('dosen')), 'DPL berhasil ditugaskan ke kelompok.');
    }

    public function assignDistrictCoordinator(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'dosen_id' => ['required', 'exists:dosen,id'],
            'kecamatan_id' => ['required', 'string'],
            'district_name' => ['nullable', 'string'],
            'regency_name' => ['nullable', 'string'],
            'periode_id' => ['required', 'exists:periode,id'],
        ]);

        $assignment = DplKecamatanAssignment::create(array_merge($validated, [
            'assigned_by' => auth()->id(),
            'is_active' => true,
        ]));

        return $this->created(['id' => $assignment->id], 'Koordinator kecamatan berhasil ditugaskan.');
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate(['file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240']]);
        return $this->success(['imported' => 0], 'Import DPL selesai.');
    }

    public function removeDplFromPeriod(DplPeriod $dplPeriod): JsonResponse
    {
        $dplPeriod->update(['is_active' => false]);
        return $this->noContent('DPL berhasil dilepas dari periode.');
    }

    public function removeDistrictCoordinator(DplKecamatanAssignment $districtCoordinator): JsonResponse
    {
        $districtCoordinator->delete();
        return $this->noContent('Koordinator kecamatan berhasil dilepas.');
    }

    public function getAvailableDpl(Request $request): JsonResponse
    {
        return $this->success(DosenResource::collection(Dosen::availableForPeriod($request->input('periode_id'))->with(['user', 'fakultas'])->get()));
    }
}
