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
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
            'phone' => $user?->phone,
            'address' => $user?->address,
        ];

        $labels = [
            'nik' => 'NIK',
            'mother_name' => 'Nama ibu kandung',
            'birth_place' => 'Tempat lahir',
            'birth_date' => 'Tanggal lahir',
            'gender' => 'Jenis kelamin',
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
        RegistrationPortalService $registrationPortalService
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
            ->map(function (array $period) use ($registrations, $queues, $registrationService) {
                $period['registration'] = $registrationService->registrationSummaryForPeriod(
                    $registrations->get($period['id']),
                    $queues->get($period['id']),
                );

                return $period;
            })
            ->values();

        return Inertia::render('Student/Register', [
            'periods' => $periods,
            'student_gender' => $mahasiswa?->gender,
            'student_academic' => $mahasiswa ? [
                'sks_completed' => $mahasiswa->sks_completed,
                'is_bta_ppi_passed' => $this->hasPassedBtaPpi($mahasiswa),
                'bta_ppi_status' => $mahasiswa->status_bta_ppi,
                'has_health_certificate' => (bool) $mahasiswa->health_certificate_path,
                'has_parent_permission' => (bool) $mahasiswa->parent_permission_path,
                'parent_permission_template' => asset('templates/surat_izin_orang_tua.docx'),
                'min_sks' => (int) SystemSetting::get('min_sks_registration', 100),
            ] : null,
            'bpjs_profile' => $this->bpjsProfileSummary($mahasiswa, auth()->user()),
        ]);
    }

    public function store(
        StoreRegistrationRequest $request,
        RegistrationService $registrationService
    ): RedirectResponse {
        $mahasiswa = $request->user()?->mahasiswa;

        if (! $mahasiswa) {
            return redirect()->back()->with('error', 'Profil mahasiswa belum ditemukan.');
        }

        $bpjsProfile = $this->bpjsProfileSummary($mahasiswa, $request->user());

        if (! $bpjsProfile['is_complete']) {
            return redirect()->route('profile.show')
                ->with('error', 'Lengkapi biodata peserta dan data BPJS terlebih dahulu sebelum mendaftar KKN.');
        }

        if ($this->hasLockedRegistration($mahasiswa)) {
            return redirect()->route('student.dashboard')
                ->with('error', 'Pendaftaran Anda sudah dikunci dan tidak dapat diubah lagi.');
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

        $registrationService->register(
            $mahasiswa,
            (int) $request->input('period_id'),
            $request->input('kelompok_id') ? (int) $request->input('kelompok_id') : null,
            $request->input('notes')
        );

        return redirect()->back()->with('success', 'Pendaftaran atau pilihan kelompok berhasil diperbarui.');
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
