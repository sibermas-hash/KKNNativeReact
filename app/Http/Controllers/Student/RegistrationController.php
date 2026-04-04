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
    public function create(
        RegistrationService $registrationService,
        RegistrationPortalService $registrationPortalService
    ): Response {
        $today = now()->toDateString();
        $mahasiswa = auth()->user()?->mahasiswa;

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
                'is_bta_ppi_passed' => $mahasiswa->is_bta_ppi_passed,
                'has_health_certificate' => (bool) $mahasiswa->health_certificate_path,
                'has_parent_permission' => (bool) $mahasiswa->parent_permission_path,
                'parent_permission_template' => asset('templates/surat_izin_orang_tua.docx'),
                'min_sks' => (int) SystemSetting::get('min_sks_registration', 100),
            ] : null,
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

        $registrationService->leaveGroup($mahasiswa, $periode->id);

        return redirect()->back()->with('success', 'Anda telah keluar dari kelompok dan kembali ke antrian.');
    }
}
