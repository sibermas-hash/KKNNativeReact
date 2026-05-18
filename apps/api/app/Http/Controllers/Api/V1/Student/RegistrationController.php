<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\PeriodeResource;
use App\Http\Resources\Api\V1\PesertaKknResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\JenisKkn;
use App\Models\KKN\KknStatementAgreement;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\User;
use App\Notifications\KKN\NewRegistrationForAdminNotification;
use App\Notifications\KKN\RegistrationSubmittedNotification;
use App\Services\ActivityLogger;
use App\Services\EligibilityService;
use App\Services\KKN\RegistrationDocumentService;
use App\Services\PeriodContextService;
use App\Services\RegistrationService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class RegistrationController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly EligibilityService $eligibilityService,
        private readonly RegistrationService $registrationService,
        private readonly PeriodContextService $periodContextService,
        private readonly RegistrationDocumentService $documentService,
    ) {}

    public function form(): JsonResponse
    {
        $user = auth()->user();
        $mahasiswa = $user->mahasiswa;

        if (! $mahasiswa) {
            return $this->forbidden('Profil mahasiswa tidak ditemukan.');
        }

        // Audit fix: jangan filter ke active/default period saja.
        // Halaman dokumen /mahasiswa/pendaftaran/{id}/dokumen butuh
        // requirements sesuai periode yang dipilih mahasiswa (Nusantara,
        // Internasional, Tematik, dll). Filter lama membuat response hanya
        // berisi periode default (biasanya Reguler), sehingga non-reguler
        // tampak ter-redirect/terbaca sebagai Reguler.
        $periods = Periode::with(['tahunAkademik', 'jenisKkn'])
            ->where('is_active', true)
            ->whereIn('current_phase', ['registration', 'placement', 'execution'])
            ->orderByDesc('registration_start')
            ->get();

        $existingRegistration = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
            ->with(['periode.jenisKkn', 'kelompok'])
            ->latest()
            ->first();

        $eligibility = $this->eligibilityService->checkEligibility($mahasiswa);

        return $this->success([
            'periods' => PeriodeResource::collection($periods),
            'eligibility' => $eligibility,
            'existing_registration' => $existingRegistration ? new PesertaKknResource($existingRegistration) : null,
            'jenis_kkn_options' => JenisKkn::dropdownOptions(),
            'biodata_complete' => $this->isBiodataComplete($mahasiswa, $user),
            'address_complete' => $this->isAddressComplete($user),
            'document_requirements' => $periods->map(fn ($p) => [
                'periode_id' => $p->id,
                'requirements' => $this->documentService->requirementsForPeriod($p),
            ])->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();
        $mahasiswa = $user->mahasiswa;

        if (! $mahasiswa) {
            return $this->forbidden('Profil mahasiswa tidak ditemukan.');
        }

        // Cek biodata lengkap (sesuai codebase lama)
        if (! $this->isBiodataComplete($mahasiswa, $user)) {
            return $this->validationError(
                ['biodata' => ['Lengkapi biodata peserta terlebih dahulu.']],
                'Lengkapi biodata peserta terlebih dahulu.'
            );
        }

        // Cek alamat asli lengkap & terverifikasi
        if (! $this->isAddressComplete($user)) {
            return $this->validationError(
                ['address' => ['Lengkapi data alamat (desa/kelurahan, kecamatan, kabupaten/kota) terlebih dahulu.']],
                'Lengkapi data alamat (desa/kelurahan, kecamatan, kabupaten/kota) terlebih dahulu.'
            );
        }

        $validated = $request->validate([
            'periode_id' => ['required', 'exists:periode,id'],
            'statement_agreement_id' => ['required', 'integer', 'exists:kkn_statement_agreements,id'],
        ]);

        $periode = Periode::findOrFail($validated['periode_id']);

        $agreement = KknStatementAgreement::where('id', $validated['statement_agreement_id'])
            ->where('mahasiswa_id', $mahasiswa->id)
            ->where('periode_id', $periode->id)
            ->where('signature_nim', (string) $mahasiswa->nim)
            ->latest('id')
            ->first();

        if (! $agreement) {
            return $this->validationError(
                ['statement_agreement_id' => ['Surat pernyataan KKN belum valid/disetujui.']],
                'Surat pernyataan KKN belum valid/disetujui.'
            );
        }

        // Cek self-service registration (sesuai codebase lama)
        if (! $periode->usesSelfServiceRegistration()) {
            return $this->validationError(
                ['periode_id' => ['Periode ini tidak menggunakan pendaftaran mandiri.']],
                'Periode ini tidak menggunakan pendaftaran mandiri.'
            );
        }

        try {
            $registration = $this->registrationService->register(
                $mahasiswa,
                $validated['periode_id'],
                null,
                null,
                $user->id,
                (int) $agreement->id
            );

            // Kirim notifikasi ke mahasiswa & superadmin (sesuai codebase lama)
            try {
                $user->notify(new RegistrationSubmittedNotification($registration, $periode->name));
                User::role('superadmin')->chunk(50, function ($admins) use ($registration, $mahasiswa, $periode) {
                    foreach ($admins as $admin) {
                        $admin->notify(new NewRegistrationForAdminNotification(
                            $registration,
                            $mahasiswa->nama ?? 'Mahasiswa',
                            $periode->name
                        ));
                    }
                });
            } catch (\Throwable $e) {
                Log::warning('Registration notification failed: '.$e->getMessage());
            }

            \DB::afterCommit(function () use ($user, $validated, $periode) {
                ActivityLogger::log('registration', 'success', $user->id, [
                    'periode_id' => (int) $validated['periode_id'],
                    'periode_name' => $periode->name,
                ]);
            });

            return $this->created(
                new PesertaKknResource($registration->load(['periode', 'kelompok'])),
                'Pendaftaran KKN berhasil dikirim.'
            );
        } catch (ValidationException $e) {
            ActivityLogger::log('registration', 'failed', $user->id, [
                'periode_id' => $validated['periode_id'] ?? null,
                'errors' => $e->errors(),
            ]);

            return $this->validationError($e->errors(), $e->getMessage());
        } catch (AuthorizationException $e) {
            return $this->forbidden($e->getMessage());
        } catch (\Exception $e) {
            return $this->serverError('Terjadi kesalahan saat memproses pendaftaran.');
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

        if ($registration->status === 'completed') {
            return $this->error('VALIDATION_ERROR', 'Pendaftaran yang sudah selesai tidak dapat dibatalkan.', 422);
        }

        if ($registration->status === 'approved' && $registration->kelompok_id) {
            return $this->error('VALIDATION_ERROR', 'Anda sudah ditempatkan di kelompok. Hubungi admin untuk keluar.', 422);
        }

        $now = now();
        if ($periode->registration_end && $now->gt($periode->registration_end)) {
            return $this->error('VALIDATION_ERROR', 'Masa pendaftaran sudah ditutup. Pembatalan tidak diizinkan.', 422);
        }

        // R11 audit-pendaftaran fix: simpan status terakhir + audit trail
        // sebelum soft-delete (deleted_at alone tidak cukup untuk forensik)
        $previousStatus = $registration->status;
        $registration->update(['status' => 'cancelled']);
        $registration->delete();

        \DB::afterCommit(function () use ($user, $registration, $periode, $previousStatus) {
            ActivityLogger::log('registration', 'cancelled', $user->id, [
                'registration_id' => $registration->id,
                'periode_id' => $periode->id,
                'periode_name' => $periode->name,
                'previous_status' => $previousStatus,
            ]);
        });

        // Return 200 JSON envelope instead of 204. Some proxy/client stacks mishandle
        // 204 JSON responses on DELETE and surface them as Cloudflare 520.
        return $this->success(null, 'Anda telah keluar dari pendaftaran KKN.');
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function isBiodataComplete($mahasiswa, $user): bool
    {
        return filled($mahasiswa?->nik)
            && filled($mahasiswa?->mother_name)
            && filled($mahasiswa?->birth_place)
            && filled($mahasiswa?->birth_date)
            && filled($mahasiswa?->gender)
            && filled($mahasiswa?->shirt_size)
            && filled($user?->phone)
            && filled($user?->address);
    }

    private function isAddressComplete($user): bool
    {
        // Audit fix: cek alamat lengkap (village + district + regency)
        return filled($user?->address)
            && filled($user?->address_village_name)
            && filled($user?->address_district_name)
            && filled($user?->address_regency_name);
    }
}
