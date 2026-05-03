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
        $validated = $request->validate([
            'academic_year_id' => ['required', 'exists:tahun_akademik,id'],
            'jenis_kkn_id' => ['nullable', 'exists:jenis_kkn,id'],
            'periode' => ['required', 'integer', 'min:1'],
            'name' => ['required', 'string', 'max:255'],
            'theme' => ['nullable', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'registration_start' => ['nullable', 'date'],
            'registration_end' => ['nullable', 'date'],
            'kuota' => ['nullable', 'integer', 'min:0'],
        ]);

        $period = Periode::create($validated);
        return $this->created(new PeriodeResource($period->load(['tahunAkademik', 'jenisKkn'])), 'Periode KKN berhasil dibuat.');
    }

    public function update(Request $request, Periode $periode): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'theme' => ['nullable', 'string', 'max:255'],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'date', 'after:start_date'],
            'registration_start' => ['nullable', 'date'],
            'registration_end' => ['nullable', 'date'],
            'kuota' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'current_phase' => ['nullable', 'string'],
        ]);

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
}
