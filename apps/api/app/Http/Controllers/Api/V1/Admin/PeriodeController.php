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
        $periode->load(['tahunAkademik', 'jenisKkn', 'kelompok']);
        return $this->success(new PeriodeResource($periode));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->validationRules($request));

        $period = Periode::create($validated);
        return $this->created(new PeriodeResource($period->load(['tahunAkademik', 'jenisKkn'])), 'Periode KKN berhasil dibuat.');
    }

    public function update(Request $request, Periode $periode): JsonResponse
    {
        $validated = $request->validate($this->validationRules($request, $periode));

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
            'is_active'          => ['nullable', 'boolean', function ($attr, $value, $fail) use ($request, $periodeId) {
                if ($value && $request->input('jenis_kkn_id')) {
                    $q = Periode::where('jenis_kkn_id', $request->input('jenis_kkn_id'))->where('is_active', true);
                    if ($periodeId) {
                        $q->where('id', '!=', $periodeId);
                    }
                    if ($q->exists()) {
                        $fail('Hanya boleh ada 1 periode aktif untuk setiap Jenis KKN.');
                    }
                }
            }],
        ];
    }
}
