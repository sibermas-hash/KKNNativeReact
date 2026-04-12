<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StoreRegistrationRequest;
use App\Models\KKN\AntrianKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\SystemSetting;
use App\Services\RegistrationPortalService;
use App\Services\RegistrationService;
use App\Services\KKN\KknRequirementService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Notifications\KKN\RegistrationSubmittedNotification;
use App\Notifications\KKN\NewRegistrationForAdminNotification;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class RegistrationController extends Controller
{
    private function hasPassedBtaPpi(?\App\Models\KKN\Mahasiswa $mahasiswa): bool
    {
        if (! $mahasiswa) {
            return false;
        }

        $legacyStatus = strtoupper(trim((string) $mahasiswa->status_bta_ppi));

        return (bool) $mahasiswa->is_bta_ppi_passed
            || in_array($legacyStatus, ['LULUS', 'PASSED', 'SUCCESS'], true);
    }

    private function bpjsProfileSummary(?\App\Models\KKN\Mahasiswa $mahasiswa, ?\App\Models\User $user): array
    {
        $required = [
            'nik' => $mahasiswa?->nik,
            'mother_name' => $mahasiswa?->mother_name,
            'birth_place' => $mahasiswa?->birth_place,
            'birth_date' => optional($mahasiswa?->birth_date)?->toDateString(),
            'gender' => $mahasiswa?->gender,
            'shirt_size' => $mahasiswa?->shirt_size,
            'bpjs_number' => $mahasiswa?->bpjs_number,
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
            'bpjs_number' => 'Nomor kartu BPJS/Asuransi',
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

    private function domicileProfileSummary(?\App\Models\User $user): array
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

    private function hasLockedRegistration(?\App\Models\KKN\Mahasiswa $mahasiswa): bool
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
        RegistrationService $registrationService,
        RegistrationPortalService $registrationPortalService,
        KknRequirementService $requirementService
    ): Response|RedirectResponse {
        $today = now()->toDateString();
        $mahasiswa = auth()->user()?->mahasiswa;

        if ($this->hasLockedRegistration($mahasiswa)) {
            return redirect()->route('student.dashboard')
                ->with('info', 'Pendaftaran Anda sudah dikunci. Silakan lanjutkan aktivitas KKN melalui dasbor mahasiswa.');
        }

        $periods = $registrationPortalService->activePeriodsSnapshot($today);

        $periodIds = $periods->pluck('id');

        $registrations = $mahasiswa
            ? PesertaKkn::query()
                ->where('mahasiswa_id', $mahasiswa->id)
                ->whereIn('period_id', $periodIds)
                ->with(['kelompok.lokasi'])
                ->get()
                ->keyBy('period_id')
            : collect();

        $queues = $mahasiswa
            ? AntrianKkn::query()
                ->where('mahasiswa_id', $mahasiswa->id)
                ->whereIn('period_id', $periodIds)
                ->get()
                ->keyBy('period_id')
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

        return Inertia::render('Student/Register', [
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
            'bpjs_profile' => $this->bpjsProfileSummary($mahasiswa, auth()->user()),
            'domicile_profile' => $this->domicileProfileSummary(auth()->user()),
        ]);
    }

    public function store(
        StoreRegistrationRequest $request,
        RegistrationService $registrationService,
        KknRequirementService $requirementService
    ): RedirectResponse {
        $mahasiswa = $request->user()?->mahasiswa;
        $periodId = (int) $request->input('period_id');
        $period = Periode::query()->findOrFail($periodId);

        if (! $mahasiswa) {
            return redirect()->back()->with('error', 'Profil mahasiswa belum ditemukan.');
        }

        // Validate KKN Scheme Requirements
        $requirementErrors = $requirementService->validate($mahasiswa, $period);
        if (!empty($requirementErrors)) {
            return redirect()->back()->withErrors([
                'period_id' => $requirementErrors
            ]);
        }

        $bpjsProfile = $this->bpjsProfileSummary($mahasiswa, $request->user());

        if (! $bpjsProfile['is_complete']) {
            return redirect()->route('profile.show')
                ->with('error', 'Lengkapi biodata peserta dan data BPJS terlebih dahulu sebelum mendaftar KKN.');
        }

        $domicileProfile = $this->domicileProfileSummary($request->user());
        if (! $domicileProfile['is_complete']) {
            return redirect()->route('profile.show')
                ->with('error', 'Lengkapi dan verifikasi alamat domisili terlebih dahulu sebelum sistem dapat menempatkan Anda ke kelompok KKN.');
        }

        if ($this->hasLockedRegistration($mahasiswa)) {
            return redirect()->route('student.dashboard')
                ->with('error', 'Pendaftaran Anda sudah dikunci dan tidak dapat diubah lagi.');
        }

        if (! $period->usesSelfServiceRegistration()) {
            return redirect()->back()->withErrors([
                'period_id' => "Periode {$period->name} tidak menggunakan pendaftaran mandiri mahasiswa. Program ini dikelola melalui seleksi khusus atau penugasan oleh LPPM.",
            ]);
        }

        if ($request->hasFile('health_certificate')) {
            if ($mahasiswa->health_certificate_path) {
                Storage::disk('local')->delete($mahasiswa->health_certificate_path);
            }

            // VULN-013 Fix: Store sensitive documents in private storage
            $path = $request->file('health_certificate')->store('health-certificates', 'local');
            $mahasiswa->update(['health_certificate_path' => $path]);
        }

        if ($request->hasFile('parent_permission')) {
            if ($mahasiswa->parent_permission_path) {
                Storage::disk('local')->delete($mahasiswa->parent_permission_path);
            }

            // VULN-013 Fix: Store sensitive documents in private storage
            $path = $request->file('parent_permission')->store('parent-permissions', 'local');
            $mahasiswa->update(['parent_permission_path' => $path]);
        }

        // FIX C10: Pass authenticated user ID for ownership verification
        $registrationService->register(
            $mahasiswa,
            $periodId,
            null,
            $request->input('notes'),
            auth()->id()
        );

        // Send notification to student
        $latestRegistration = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
            ->where('period_id', $periodId)
            ->latest()
            ->first();

        if ($latestRegistration) {
            $request->user()->notify(new RegistrationSubmittedNotification(
                $latestRegistration,
                $period->name,
            ));

            // Notify all superadmin users
            User::role('superadmin')->each(function (User $admin) use ($latestRegistration, $mahasiswa, $period) {
                $admin->notify(new NewRegistrationForAdminNotification(
                    $latestRegistration,
                    $mahasiswa->nama ?? 'Mahasiswa',
                    $period->name,
                ));
            });
        }

        $governance = $period->governance();
        $message = "Pendaftaran {$period->name} berhasil diajukan.";

        if ($governance['registration_mode'] === 'open') {
            $message .= " Setelah admin menyetujui pendaftaran Anda, sistem akan menempatkan Anda otomatis ke kelompok yang sesuai di luar kabupaten/kota domisili.";
        } else {
            $message .= " Skema " . ($governance['jenis_label'] ?? 'Khusus') . " memerlukan tahap seleksi khusus. Mohon pantau status pendaftaran Anda secara berkala.";
        }

        return redirect()->back()->with('success', $message);
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
