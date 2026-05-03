<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\PesertaKknResource;
use App\Http\Resources\Api\V1\PeriodeResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\DokumenPesertaKkn;
use App\Models\KKN\JenisKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Services\EligibilityService;
use App\Services\PeriodContextService;
use App\Services\RegistrationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RegistrationController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly EligibilityService $eligibilityService,
        private readonly RegistrationService $registrationService,
        private readonly PeriodContextService $periodContextService,
    ) {}

    public function form(): JsonResponse
    {
        $user = auth()->user();
        $mahasiswa = $user->mahasiswa;

        if (! $mahasiswa) {
            return $this->forbidden('Profil mahasiswa tidak ditemukan.');
        }

        $activePeriodId = $this->periodContextService->getActivePeriodId()
            ?? $this->periodContextService->getDefaultPeriodId();

        $periods = Periode::with(['tahunAkademik', 'jenisKkn'])
            ->where('is_active', true)
            ->when($activePeriodId, fn ($q) => $q->where('id', $activePeriodId))
            ->orderBy('periode', 'desc')
            ->get();

        $existingRegistration = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
            ->with(['periode.jenisKkn', 'kelompok'])
            ->latest()
            ->first();

        $eligibility = $this->eligibilityService->checkStudent($mahasiswa);

        return $this->success([
            'periods' => PeriodeResource::collection($periods),
            'eligibility' => $eligibility,
            'existing_registration' => $existingRegistration ? new PesertaKknResource($existingRegistration) : null,
            'jenis_kkn_options' => JenisKkn::dropdownOptions(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();
        $mahasiswa = $user->mahasiswa;

        if (! $mahasiswa) {
            return $this->forbidden('Profil mahasiswa tidak ditemukan.');
        }

        $validated = $request->validate([
            'periode_id' => ['required', 'exists:periode,id'],
            'jenis_kkn_id' => ['nullable', 'exists:jenis_kkn,id'],
        ]);

        try {
            $registration = $this->registrationService->register($mahasiswa, $validated['periode_id'], $validated['jenis_kkn_id'] ?? null);

            return $this->created(
                new PesertaKknResource($registration->load(['periode', 'kelompok'])),
                'Pendaftaran KKN berhasil dikirim.'
            );
        } catch (\Throwable $e) {
            return $this->error('VALIDATION_ERROR', $e->getMessage(), 422);
        }
    }

    public function status(): JsonResponse
    {
        $user = auth()->user();
        $mahasiswa = $user->mahasiswa;

        if (! $mahasiswa) {
            return $this->success(['registrations' => []]);
        }

        $registrations = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
            ->with(['periode.jenisKkn', 'kelompok.lokasi', 'dokumen'])
            ->orderByDesc('created_at')
            ->get();

        return $this->success([
            'registrations' => PesertaKknResource::collection($registrations),
        ]);
    }

    public function leave(Request $request, Periode $periode): JsonResponse
    {
        $user = auth()->user();
        $mahasiswa = $user->mahasiswa;

        if (! $mahasiswa) {
            return $this->forbidden();
        }

        $registration = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
            ->where('periode_id', $periode->id)
            ->first();

        if (! $registration) {
            return $this->notFound('Pendaftaran tidak ditemukan.');
        }

        if ($registration->status === 'approved' && $registration->kelompok_id) {
            return $this->error('VALIDATION_ERROR', 'Anda sudah ditempatkan di kelompok. Hubungi admin untuk keluar.', 422);
        }

        $registration->delete();

        return $this->noContent('Anda telah keluar dari pendaftaran KKN.');
    }
}
