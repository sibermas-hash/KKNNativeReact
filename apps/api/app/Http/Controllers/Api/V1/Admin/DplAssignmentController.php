<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\DosenResource;
use App\Http\Resources\Api\V1\DplPeriodResource;
use App\Http\Resources\Api\V1\KelompokKknResource;
use App\Imports\DplAssignmentImport;
use App\Models\KKN\Dosen;
use App\Models\KKN\DplKecamatanAssignment;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Periode;
use App\Services\DplAssignmentService;
use App\Services\DplEligibilityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Maatwebsite\Excel\Facades\Excel;

class DplAssignmentController extends Controller
{
    public function __construct(
        private readonly DplAssignmentService $assignmentService,
        private readonly DplEligibilityService $eligibilityService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('manageDplAssignment');

        $query = DplPeriod::with(['dosen.user', 'dosen.fakultas', 'periode', 'kelompok'])
            ->when($request->input('periode_id'), fn ($q, $id) => $q->where('periode_id', $id))
            ->orderByDesc('created_at');

        return $this->successCollection(DplPeriodResource::collection($query->paginate(25)));
    }

    public function assignToPeriod(Request $request): JsonResponse
    {
        Gate::authorize('manageDplAssignment');

        $validated = $request->validate([
            'dosen_id' => ['required', 'exists:dosen,id'],
            'periode_id' => ['required', 'exists:periode,id'],
            'max_groups' => ['required', 'integer', 'min:1', 'max:20'],
        ]);

        $dosen = Dosen::findOrFail($validated['dosen_id']);
        $periode = Periode::findOrFail($validated['periode_id']);

        // Check eligibility
        $qualification = $this->eligibilityService->isQualifiedForDpl($dosen, $periode->id);
        if (! $qualification['eligible']) {
            return $this->error('VALIDATION_ERROR', 'Dosen tidak memenuhi syarat: '.$qualification['reason'], 422);
        }

        try {
            $result = $this->assignmentService->activateForPeriod(
                $dosen,
                $periode,
                $validated['max_groups']
            );

            return $this->created(
                new DplPeriodResource($result['assignment']->load(['dosen', 'periode'])),
                'DPL berhasil ditugaskan ke periode.'
            );
        } catch (\DomainException $e) {
            return $this->error('VALIDATION_ERROR', $e->getMessage(), 422);
        }
    }

    public function assignToGroup(Request $request, KelompokKkn $group): JsonResponse
    {
        Gate::authorize('manageDplAssignment');

        $validated = $request->validate([
            'dpl_period_id' => ['required', 'exists:dpl_periode,id'],
        ]);

        $dplPeriod = DplPeriod::findOrFail($request->input('dpl_period_id'));

        try {
            $this->assignmentService->assignPrimaryGroup($dplPeriod, $group);

            return $this->success(
                new KelompokKknResource($group->refresh()->load('dosen')),
                'DPL berhasil ditugaskan ke kelompok.'
            );
        } catch (\DomainException $e) {
            return $this->error('VALIDATION_ERROR', $e->getMessage(), 422);
        }
    }

    public function assignDistrictCoordinator(Request $request): JsonResponse
    {
        Gate::authorize('manageDplAssignment');

        $validated = $request->validate([
            'dosen_id' => ['required', 'exists:dosen,id'],
            'kecamatan_id' => ['required', 'string'],
            'district_name' => ['nullable', 'string'],
            'regency_name' => ['nullable', 'string'],
            'periode_id' => ['required', 'exists:periode,id'],
        ]);

        $dosen = Dosen::findOrFail($validated['dosen_id']);
        $periode = Periode::findOrFail($validated['periode_id']);

        // Get DPL period for this dosen
        $dplPeriod = DplPeriod::where('dosen_id', $dosen->id)
            ->where('periode_id', $periode->id)
            ->where('is_active', true)
            ->first();

        if (! $dplPeriod) {
            return $this->error('VALIDATION_ERROR', 'DPL periode tidak ditemukan atau tidak aktif.', 422);
        }

        try {
            $assignment = $this->assignmentService->assignDistrictCoordinator(
                $dplPeriod,
                $validated['kecamatan_id'],
                $validated['district_name'] ?? '',
                $validated['regency_name'] ?? null,
                auth()->id()
            );

            return $this->created(['id' => $assignment->id], 'Koordinator kecamatan berhasil ditugaskan.');
        } catch (\DomainException $e) {
            return $this->error('VALIDATION_ERROR', $e->getMessage(), 422);
        }
    }

    public function import(Request $request): JsonResponse
    {
        Gate::authorize('manageDplAssignment');

        $request->validate(['file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240']]);

        $import = new DplAssignmentImport($this->assignmentService);
        Excel::import($import, $request->file('file'));

        return $this->success([
            'activated' => $import->activatedCount,
            'group_assigned' => $import->groupAssignmentCount,
            'district_coordinator' => $import->districtCoordinatorCount,
            'provisioned' => $import->provisionedAccountCount,
            'skipped' => $import->skippedCount,
            'errors' => $import->errors,
        ], "Import selesai: {$import->activatedCount} diaktifkan, {$import->groupAssignmentCount} ditugaskan ke kelompok.");
    }

    public function removeDplFromPeriod(DplPeriod $dplPeriod): JsonResponse
    {
        Gate::authorize('manageDplAssignment');

        $dplPeriod->update(['is_active' => false]);

        return $this->noContent('DPL berhasil dilepas dari periode.');
    }

    public function removeDistrictCoordinator(DplKecamatanAssignment $districtCoordinator): JsonResponse
    {
        Gate::authorize('manageDplAssignment');

        $districtCoordinator->delete();

        return $this->noContent('Koordinator kecamatan berhasil dilepas.');
    }

    public function getAvailableDpl(Request $request): JsonResponse
    {
        Gate::authorize('manageDplAssignment');

        $periodeId = $request->input('periode_id');
        if (! $periodeId) {
            return $this->error('VALIDATION_ERROR', 'periode_id is required', 422);
        }

        return $this->success(
            DosenResource::collection(
                Dosen::availableForPeriod($periodeId)->with(['user', 'fakultas'])->get()
            )
        );
    }
}
