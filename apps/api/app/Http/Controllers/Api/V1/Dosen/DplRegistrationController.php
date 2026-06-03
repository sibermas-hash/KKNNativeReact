<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Dosen;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaWorkshop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DplRegistrationController extends Controller
{
    use ApiResponse;



    /**
     * GET /dosen/dpl-eligibility
     */
    public function eligibility(): JsonResponse
    {
        $user = auth()->user();
        $dosen = $user->dosen;

        if (! $dosen) {
            return $this->success(['eligible' => false, 'has_nidn' => false, 'has_passed_workshop' => false, 'registrations' => [], 'reasons' => ['Data dosen Anda tidak ditemukan dalam sistem.']]);
        }

        $hasNidn = filled($dosen->nidn);
        $hasPassedWorkshop = PesertaWorkshop::where('user_id', $user->id)->where('is_passed', true)->where('attendance_status', 'attended')->exists();
        $reasons = [];
        if (! $hasNidn) $reasons[] = 'NIDN belum terisi.';
        if (! $hasPassedWorkshop) $reasons[] = 'Belum tercatat hadir dan lulus Workshop Pembekalan DPL.';

        $registrations = DplPeriod::where('dosen_id', $dosen->id)
            ->with('periode:id,name,current_phase')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'periode_id' => $item->periode_id,
                'periode_name' => $item->periode?->name,
                'status' => $item->status,
                'is_active' => (bool) $item->is_active,
                'created_at' => $item->created_at?->toISOString(),
            ])->values();

        return $this->success([
            'eligible' => $hasNidn && $hasPassedWorkshop,
            'has_nidn' => $hasNidn,
            'nidn' => $dosen->nidn,
            'has_passed_workshop' => $hasPassedWorkshop,
            'registrations' => $registrations,
            'reasons' => $reasons,
        ]);
    }

    /**
     * GET /dosen/available-periods
     * Return active periods that dosen can register as DPL for.
     */
    public function availablePeriods(): JsonResponse
    {
        $periods = Periode::where('is_active', true)
            ->whereIn('current_phase', ['upcoming', 'registration', 'placement'])
            ->select('id', 'name', 'current_phase', 'start_date', 'end_date')
            ->orderByDesc('id')
            ->get();

        return $this->success($periods);
    }

    /**
     * Dosen mendaftar sebagai DPL untuk periode tertentu.
     * Syarat: sudah lulus workshop pembekalan.
     */
    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();
        $dosen = $user->dosen;

        if (! $dosen) {
            return $this->error('VALIDATION_ERROR', 'Data dosen Anda tidak ditemukan dalam sistem.', 422);
        }

        if (blank($dosen->nidn)) {
            return $this->error('VALIDATION_ERROR', 'Anda harus memiliki NIDN untuk mendaftar sebagai DPL.', 422);
        }

        $hasPassedWorkshop = PesertaWorkshop::where('user_id', $user->id)
            ->where('is_passed', true)
            ->where('attendance_status', 'attended')
            ->exists();

        if (! $hasPassedWorkshop) {
            return $this->error('VALIDATION_ERROR', 'Anda harus hadir dan lulus Workshop Pembekalan DPL terlebih dahulu.', 422);
        }

        $validated = $request->validate([
            'periode_id' => 'required|exists:periode,id',
            'max_kelompok_kkn' => ['nullable', 'integer', 'min:1', 'max:10'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $existing = DplPeriod::where('dosen_id', $dosen->id)
            ->where('periode_id', $validated['periode_id'])
            ->whereIn('status', ['pending', 'approved'])
            ->first();

        if ($existing) {
            $label = $existing->status === 'pending' ? 'menunggu verifikasi' : 'sudah disetujui';

            return $this->error('DPL_REGISTRATION_EXISTS', "Anda sudah memiliki pendaftaran DPL yang {$label} untuk periode ini.", 409);
        }

        $periode = Periode::findOrFail($validated['periode_id']);

        $registration = DplPeriod::create([
            'dosen_id' => $dosen->id,
            'periode_id' => $periode->id,
            'max_kelompok_kkn' => $validated['max_kelompok_kkn'] ?? 5,
            'is_active' => false,
            'status' => 'pending',
        ]);

        return $this->success($registration, 'Pendaftaran DPL berhasil diajukan. Menunggu verifikasi admin.', 201);
    }
}
