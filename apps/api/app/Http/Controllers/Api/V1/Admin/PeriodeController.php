<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\PeriodeResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Periode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PeriodeController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $periods = Periode::with(['tahunAkademik', 'jenisKkn'])
            ->when($request->input('academic_year_id'), fn ($q, $id) => $q->where('academic_year_id', $id))
            ->orderByDesc('periode')
            ->paginate($request->input('per_page', 25));

        return $this->successCollection(PeriodeResource::collection($periods));
    }

    public function show(Periode $periode): JsonResponse
    {
        $periode->load(['tahunAkademik', 'jenisKkn.documentRequirements.defaultTemplate', 'kelompok', 'documentTemplates']);
        return $this->success(new PeriodeResource($periode));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->validationRules($request));

        // Default current_phase to 'upcoming' if not provided
        if (empty($validated['current_phase'])) {
            $validated['current_phase'] = 'upcoming';
        }

        // Auto-deactivate other periods of same jenis_kkn if this one is being activated
        if (! empty($validated['is_active']) && ! empty($validated['jenis_kkn_id'])) {
            Periode::where('jenis_kkn_id', $validated['jenis_kkn_id'])
                ->where('is_active', true)
                ->update(['is_active' => false]);
        }

        $period = Periode::create($validated);
        return $this->created(new PeriodeResource($period->load(['tahunAkademik', 'jenisKkn'])), 'Periode KKN berhasil dibuat.');
    }

    public function update(Request $request, Periode $periode): JsonResponse
    {
        $validated = $request->validate($this->validationRules($request, $periode));

        // Auto-deactivate other periods of same jenis_kkn if this one is being activated
        $jenisKknId = $validated['jenis_kkn_id'] ?? $periode->jenis_kkn_id;
        $isBeingActivated = isset($validated['is_active']) && $validated['is_active'] && ! $periode->is_active;
        if ($isBeingActivated && $jenisKknId) {
            Periode::where('jenis_kkn_id', $jenisKknId)
                ->where('is_active', true)
                ->where('id', '!=', $periode->id)
                ->update(['is_active' => false]);
        }

        $periode->update($validated);
        return $this->success(new PeriodeResource($periode->refresh()->load(['tahunAkademik', 'jenisKkn'])), 'Periode berhasil diperbarui.');
    }

    public function destroy(Periode $periode): JsonResponse
    {
        try {
            $periode->delete();
            return $this->noContent('Periode berhasil dihapus.');
        } catch (\Throwable $e) {
            return $this->error('VALIDATION_ERROR', 'Gagal menghapus periode: '.$e->getMessage(), 422);
        }
    }

    public function duplicate(Periode $periode): JsonResponse
    {
        try {
            $new = $periode->replicate();
            $new->name = $periode->name.' (Copy)';
            $new->is_active = false;
            $new->save();
            return $this->created(new PeriodeResource($new->load(['tahunAkademik', 'jenisKkn'])), 'Periode berhasil diduplikasi.');
        } catch (\Throwable $e) {
            return $this->error('SERVER_ERROR', 'Gagal menduplikasi: '.$e->getMessage(), 500);
        }
    }

    public function export(): JsonResponse
    {
        $periods = Periode::with(['tahunAkademik', 'jenisKkn'])->orderByDesc('periode')->get();
        return $this->success(PeriodeResource::collection($periods));
    }

    private function validationRules(Request $request, ?Periode $existing = null): array
    {
        $isUpdate = $existing !== null;
        $req = $isUpdate ? 'sometimes' : 'required';
        $periodeId = $existing?->id;

        return [
            'academic_year_id'   => [$req, 'exists:tahun_akademik,id'],
            'jenis_kkn_id'       => [$req, 'exists:jenis_kkn,id'],
            'periode'            => [$req, 'integer', 'min:1'],
            'name'               => [$req, 'string', 'max:255'],
            'theme'              => ['nullable', 'string', 'max:255'],
            'start_date'         => [$req, 'date', function ($attr, $value, $fail) use ($request) {
                $regEnd = $request->input('registration_end');
                if ($regEnd && $value) {
                    $gap = \Carbon\Carbon::parse($regEnd)->diffInDays(\Carbon\Carbon::parse($value));
                    if ($gap < 7) {
                        $fail("Jarak minimal antara penutupan pendaftaran dan mulai pelaksanaan adalah 7 hari. Saat ini hanya {$gap} hari.");
                    }
                }
            }],
            'end_date'           => [$req, 'date', 'after:start_date'],
            'registration_start' => [$req, 'date'],
            'registration_end'   => [$req, 'date', 'after:registration_start'],
            'grading_start'      => ['nullable', 'date'],
            'grading_end'        => ['nullable', 'date', 'after_or_equal:grading_start'],
            'kuota'              => [$req, 'integer', 'min:1'],
            'current_phase'      => ['nullable', 'string', 'in:upcoming,registration,placement,execution,grading,finished'],
            'is_active'          => ['nullable', 'boolean'],
        ];
    }
}
