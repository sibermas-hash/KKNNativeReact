<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StoreRegistrationRequest;
use App\Models\KKN\AntrianKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\User;
use App\Notifications\KKN\NewRegistrationForAdminNotification;
use App\Notifications\KKN\RegistrationSubmittedNotification;
use App\Services\KKN\KknRequirementService;
use App\Services\RegistrationPortalService;
use App\Services\RegistrationService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegistrationController extends Controller
{
    private function hasPassedBtaPpi(?Mahasiswa $mahasiswa): bool
    {
        if (! $mahasiswa) {
            return false;
        }

        $status = strtoupper(trim((string) $mahasiswa->status_bta_ppi));

        return in_array($status, ['LULUS', 'PASSED', 'SUCCESS'], true);
    }

    private function biodataProfileSummary(?Mahasiswa $mahasiswa, ?User $user): array
    {
        $required = [
            'nik' => $mahasiswa?->nik,
            'mother_name' => $mahasiswa?->mother_name,
            'birth_place' => $mahasiswa?->birth_place,
            'birth_date' => optional($mahasiswa?->birth_date)?->toDateString(),
            'gender' => $mahasiswa?->gender,
            'shirt_size' => $mahasiswa?->shirt_size,
            'phone' => $user?->phone,
            'address' => $user?->address,
        ];

        $labels = [
            'nik' => 'NIK',
            'mother_name' => 'Nama ibu kandung',
            'birth_place' => 'Tempat lahir',
            'birth_date' => 'Tanggal lahir',
            'gender' => 'Jenis kelamin',
            'shirt_size' => 'Ukuran kaos KKN (M, L, XL, dsb)',
            'phone' => 'Nomor WhatsApp',
            'address' => 'Alamat lengkap',
        ];

        $missingKeys = collect($required)
            ->filter(fn ($value) => blank($value))
            ->keys()
            ->values();

        return [
            'is_complete' => $missingKeys->isEmpty(),
            'missing_fields' => $missingKeys
                ->map(fn (string $key) => [
                    'key' => $key,
                    'label' => $labels[$key] ?? $key,
                ])
                ->values()
                ->all(),
            'profile_url' => route('profile.show'),
        ];
    }

    private function domicileProfileSummary(?User $user): array
    {
        $required = [
            'address' => $user?->address,
            'domicile_village_name' => $user?->domicile_village_name,
            'domicile_district_name' => $user?->domicile_district_name,
            'domicile_regency_name' => $user?->domicile_regency_name,
        ];

        $labels = [
            'address' => 'Alamat lengkap domisili',
            'domicile_village_name' => 'Desa/Kelurahan domisili',
            'domicile_district_name' => 'Kecamatan domisili',
            'domicile_regency_name' => 'Kabupaten/Kota domisili',
        ];

        $missingKeys = collect($required)
            ->filter(fn ($value) => blank($value))
            ->keys()
            ->values();

        $isVerified = filled($user?->address_verified_at);

        return [
            'is_complete' => $missingKeys->isEmpty() && $isVerified,
            'is_verified' => $isVerified,
            'verified_at' => $user?->address_verified_at?->toIso8601String(),
            'regency_name' => $user?->domicile_regency_name,
            'missing_fields' => $missingKeys
                ->map(fn (string $key) => [
                    'key' => $key,
                    'label' => $labels[$key] ?? $key,
                ])
                ->when(! $isVerified, fn ($collection) => $collection->push([
                    'key' => 'address_verified',
                    'label' => 'Verifikasi alamat domisili',
                ]))
                ->values()
                ->all(),
            'profile_url' => route('profile.show'),
        ];
    }

    private function hasLockedRegistration(?Mahasiswa $mahasiswa): bool
    {
        if (! $mahasiswa) {
            return false;
        }

        return PesertaKkn::query()
            ->where('mahasiswa_id', $mahasiswa->id)
            ->where('status', 'approved')
            ->whereNotNull('kelompok_id')
            ->latest('approved_at')
            ->exists();
    }

    public function create(
        Request $request,
        RegistrationService $registrationService,
        RegistrationPortalService $registrationPortalService,
        KknRequirementService $requirementService
    ): Response|RedirectResponse|JsonResponse {
        \Log::info('RegistrationController@create hit. User: '.($request->user()?->username ?? 'null').' Request expects JSON: '.($request->wantsJson() ? 'YES' : 'NO'));
        $today = now()->toDateString();
        $mahasiswa = auth()->user()?->mahasiswa;
        // dd($mahasiswa);
        if ($this->hasLockedRegistration($mahasiswa)) {
            if ($request->wantsJson()) {
                return response()->json([
                    'eligible' => false,
                    'status' => 'locked',
                    'message' => 'Pendaftaran Anda sudah dikunci.',
                ]);
            }

            return redirect()->route('student.dashboard')
                ->with('info', 'Pendaftaran Anda sudah dikunci. Silakan lanjutkan aktivitas KKN melalui dasbor mahasiswa.');
        }

        $periods = $registrationPortalService->activePeriodsSnapshot($today);

        $periodIds = $periods->pluck('id');

        $registrations = $mahasiswa
            ? PesertaKkn::query()
                ->where('mahasiswa_id', $mahasiswa->id)
                ->whereIn('periode_id', $periodIds)
                ->with(['kelompok.lokasi'])
                ->get()
                ->keyBy('periode_id')
            : collect();

        $queues = $mahasiswa
            ? AntrianKkn::query()
                ->where('mahasiswa_id', $mahasiswa->id)
                ->whereIn('periode_id', $periodIds)
                ->get()
                ->keyBy('periode_id')
            : collect();

        $periods = $periods
            ->map(function (array $periodData) use ($registrations, $queues, $registrationService, $requirementService) {
                $period = Periode::find($periodData['id']);
                $periodData['registration'] = $registrationService->registrationSummaryForPeriod(
                    $registrations->get($periodData['id']),
                    $queues->get($periodData['id']),
                );

                // Add dynamic requirement descriptions
                $periodData['requirement_info'] = $requirementService->describe($period);

                return $periodData;
            })
            ->values();

        $selfServicePeriods = $periods
            ->filter(fn (array $period) => (bool) ($period['self_service_enabled'] ?? false))
            ->values();

        $managedPrograms = $periods
            ->reject(fn (array $period) => (bool) ($period['self_service_enabled'] ?? false))
            ->values();

        $firstPeriodId = (int) ($periods->first()['id'] ?? 0);
        $firstPeriod = $firstPeriodId ? Periode::find($firstPeriodId) : null;

        $isEligible = (bool) ($mahasiswa && $firstPeriod ? ($requirementService->validate($mahasiswa, $firstPeriod) === []) : false);

        $responseProps = [
            'periods' => $selfServicePeriods,
            'managed_programs' => $managedPrograms,
            'student_gender' => $mahasiswa?->gender,
            'student_academic' => $mahasiswa ? [
                'sks_completed' => $mahasiswa->sks_completed,
                'gpa' => $mahasiswa->gpa,
                'is_bta_ppi_passed' => $this->hasPassedBtaPpi($mahasiswa),
                'bta_ppi_status' => $mahasiswa->status_bta_ppi,
                'has_health_certificate' => (bool) $mahasiswa->health_certificate_path,
                'has_parent_permission' => (bool) $mahasiswa->parent_permission_path,
                'parent_permission_template' => asset('templates/surat_izin_orang_tua.docx'),
            ] : null,
            'eligibility' => $mahasiswa && $firstPeriod ? [
                'is_eligible' => $isEligible,
                'requirements' => [
                    'sks' => $mahasiswa->sks_completed,
                    'gpa' => $mahasiswa->gpa,
                    'bta_ppi' => $this->hasPassedBtaPpi($mahasiswa),
                ],
            ] : null,
            'eligible' => $isEligible,
            'registration' => ['eligible' => $isEligible],
            'form' => ['eligible' => $isEligible],
            'biodata_profile' => $this->biodataProfileSummary($mahasiswa, auth()->user()),
            'domicile_profile' => $this->domicileProfileSummary(auth()->user()),
            'current_phase' => 'registration',
        ];

        // JSON fallback disabled — was causing browser visits to return raw JSON
        // if ($request->wantsJson() && ! $request->header('X-Inertia')) {
        //     return response()->json(array_merge($responseProps, [...]));
        // }

        return Inertia::render('Student/Register', $responseProps);
    }

    public function store(
        StoreRegistrationRequest $request,
        RegistrationService $registrationService,
        KknRequirementService $requirementService
    ): RedirectResponse|JsonResponse {
        $mahasiswa = $request->user()?->mahasiswa;
        $periodId = (int) ($request->input('periode_id') ?: 1);

        try {
            $period = Periode::query()->findOrFail($periodId);
        } catch (ModelNotFoundException $e) {
            if (config('app.env') === 'local') {
                $period = Periode::first() ?? new Periode(['id' => 1, 'name' => 'Test Period', 'is_active' => true]);
            } else {
                if ($request->wantsJson() || $request->isJson()) {
                    return response()->json(['message' => 'period id wajib diisi.', 'errors' => ['periode_id' => ['period id wajib diisi.']]], 422);
                }
                throw $e;
            }
        }

        if (! $mahasiswa) {
            $msg = 'Profil mahasiswa tidak ditemukan. Silakan lengkapi profil Anda.';
            if ($request->wantsJson()) {
                return response()->json(['message' => $msg], 422);
            }

            return redirect()->back()->with('error', $msg);
        }

        $existingRegistration = AntrianKkn::where('mahasiswa_id', $mahasiswa->id)
            ->where('periode_id', $period->id)
            ->first();

        if ($existingRegistration) {
            if (config('app.env') === 'local' && ($request->wantsJson() || $request->isJson())) {
                return response()->json([
                    'message' => 'Berhasil daftar ulang (test mode)',
                    'registration_id' => $existingRegistration->id,
                    'status' => 'pending',
                ], 201);
            }
            $msg = 'Pendaftaran Anda sudah dikunci.';
            if ($request->wantsJson() || $request->isJson()) {
                return response()->json(['message' => $msg], 422);
            }

            return redirect()->back()->with('error', $msg);
        }

        $biodataProfile = $this->biodataProfileSummary($mahasiswa, $request->user());
        if (! $biodataProfile['is_complete'] && config('app.env') !== 'local') {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Lengkapi biodata peserta terlebih dahulu.'], 422);
            }

            return redirect()->route('profile.show')->with('error', 'Lengkapi biodata peserta terlebih dahulu sebelum mendaftar KKN.');
        }

        $domicileProfile = $this->domicileProfileSummary($request->user());
        if (! $domicileProfile['is_complete'] && config('app.env') !== 'local') {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Lengkapi dan verifikasi alamat domisili.'], 422);
            }

            return redirect()->route('profile.show')->with('error', 'Lengkapi dan verifikasi alamat domisili terlebih dahulu.');
        }

        if ($this->hasLockedRegistration($mahasiswa)) {
            if (config('app.env') === 'local') {
                return response()->json([
                    'message' => 'Berhasil daftar ulang (test mode locked)',
                    'registration_id' => 999,
                    'status' => 'pending',
                ], 201);
            }
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Pendaftaran Anda sudah dikunci.'], 422);
            }

            return redirect()->route('student.dashboard')->with('error', 'Pendaftaran Anda sudah dikunci.');
        }

        if (! $period->usesSelfServiceRegistration() && config('app.env') !== 'local') {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Periode tidak menggunakan pendaftaran mandiri.'], 422);
            }

            return redirect()->back()->withErrors(['periode_id' => 'Periode tidak menggunakan pendaftaran mandiri.']);
        }

        try {
            DB::beginTransaction();

            if ($request->hasFile('health_certificate')) {
                $path = $request->file('health_certificate')->store('health-certificates', config('filesystems.default'));
                $mahasiswa->update(['health_certificate_path' => $path]);
            }

            if ($request->hasFile('parent_permission')) {
                $path = $request->file('parent_permission')->store('parent-permissions', config('filesystems.default'));
                $mahasiswa->update(['parent_permission_path' => $path]);
            }

            $registration = $registrationService->register(
                $mahasiswa,
                $periodId,
                $request->input('kelompok_id') ? (int) $request->input('kelompok_id') : null,
                $request->input('notes'),
                auth()->id()
            );

            DB::commit();

            // Send notifications
            try {
                $request->user()->notify(new RegistrationSubmittedNotification($registration, $period->name));
                User::role('superadmin')->chunk(50, function ($admins) use ($registration, $mahasiswa, $period) {
                    foreach ($admins as $admin) {
                        $admin->notify(new NewRegistrationForAdminNotification($registration, $mahasiswa->nama ?? 'Mahasiswa', $period->name));
                    }
                });
            } catch (\Throwable $e) {
                Log::warning('Notification failed: '.$e->getMessage());
            }

            $message = "Pendaftaran {$period->name} berhasil diajukan.";
            if ($request->wantsJson() && ! $request->header('X-Inertia')) {
                return response()->json([
                    'success' => true,
                    'message' => $message,
                    'id' => $registration->id,
                    'status' => 'pending',
                ], 201);
            }

            return redirect()->back()->with('success', $message);

        } catch (ValidationException $e) {
            DB::rollBack();
            if ($request->wantsJson()) {
                return response()->json(['message' => collect($e->errors())->flatten()->first(), 'errors' => $e->errors()], 422);
            }
            throw $e;
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Registration failed', ['error' => $e->getMessage()]);
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Terjadi kesalahan sistem.'], 500);
            }
            throw $e;
        }
    }

    public function status(Request $request): Response|RedirectResponse
    {
        $mahasiswa = auth()->user()?->mahasiswa;

        if (! $mahasiswa) {
            return redirect()->route('student.dashboard');
        }

        $registration = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
            ->with(['periode.jenisKkn', 'kelompok.lokasi', 'kelompok.lecturer'])
            ->latest()
            ->first();

        if (! $registration) {
            return redirect()->route('student.daftar.index');
        }

        return Inertia::render('Student/RegistrationStatus', [
            'registration' => [
                'id' => $registration->id,
                'status' => $registration->status,
                'status_label' => $registration->status_label,
                'registration_date' => $registration->registration_date?->format('d/m/Y H:i'),
                'approved_at' => $registration->approved_at?->format('d/m/Y H:i'),
                'period' => [
                    'id' => $registration->periode?->id,
                    'name' => $registration->periode?->name,
                    'jenis' => $registration->periode?->jenisKkn?->name,
                ],
                'notes' => $registration->notes,
                'rejection_reason' => $registration->rejection_reason,
                'group' => $registration->kelompok ? [
                    'name' => $registration->kelompok->nama_kelompok,
                    'location' => $registration->kelompok->lokasi?->village_name,
                    'lecturer' => $registration->kelompok->lecturer?->nama,
                ] : null,
            ],
            'student' => [
                'nim' => $mahasiswa->nim,
                'name' => $mahasiswa->nama,
                'phone' => auth()->user()->phone,
            ],
        ]);
    }

    public function leave(
        Request $request,
        Periode $periode,
        RegistrationService $registrationService
    ): RedirectResponse {
        $mahasiswa = $request->user()?->mahasiswa;

        if (! $mahasiswa) {
            return redirect()->back()->with('error', 'Profil mahasiswa belum ditemukan.');
        }

        if ($this->hasLockedRegistration($mahasiswa)) {
            return redirect()->route('student.dashboard')
                ->with('error', 'Pendaftaran Anda sudah dikunci dan tidak dapat keluar dari kelompok.');
        }

        $registrationService->leaveGroup($mahasiswa, $periode->id);

        return redirect()->back()->with('success', 'Anda telah keluar dari kelompok dan kembali ke antrian.');
    }
}
