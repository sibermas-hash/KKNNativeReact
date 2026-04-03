<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StoreRegistrationRequest;
use App\Models\KKN\Periode;
use App\Services\RegistrationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class RegistrationController extends Controller
{
    public function create(): Response
    {
        $mahasiswa = auth()->user()->mahasiswa;

        $periods = Periode::query()
            ->where('is_active', true)
            ->whereDate('registration_start', '<=', now())
            ->whereDate('registration_end', '>=', now())
            ->withCount(['peserta' => function ($query) {
                $query->where('status', 'approved');
            }])
            ->with(['kelompok' => function ($query) {
                $query->where('status', 'active')
                    ->with(['lokasi', 'dosen'])
                    ->withCount(['peserta' => function ($q) {
                        $q->where('status', 'approved');
                    }]);
            }])
            ->get()
            ->map(function ($period) use ($mahasiswa) {
                $registration = $mahasiswa
                    ? $period->peserta()
                        ->where('mahasiswa_id', $mahasiswa->id)
                        ->with(['kelompok.lokasi', 'kelompok.dosen'])
                        ->first()
                    : null;

                $queue = $mahasiswa
                    ? \App\Models\KKN\AntrianKkn::where('mahasiswa_id', $mahasiswa->id)
                        ->where('period_id', $period->id)
                        ->first()
                    : null;

                return [
                    'id' => $period->id,
                    'nama' => $period->name,
                    'registration_start' => $period->registration_start?->toDateString(),
                    'registration_end' => $period->registration_end?->toDateString(),
                    'kelompok' => $period->kelompok->map(fn($g) => [
                        'id' => $g->id,
                        'nama_kelompok' => $g->nama_kelompok,
                        'capacity' => $g->capacity,
                        'peserta_count' => $g->peserta_count,
                        'remaining_seats' => max(0, $g->capacity - $g->peserta_count),
                        'lokasi' => $g->lokasi,
                        'slot_terkunci' => [], // Placeholder for future slot rules
                        'male_member_count' => 0, // Placeholder
                        'female_member_count' => 0, // Placeholder
                        'requires_more_male_members' => false,
                        'reserved_male_slots' => 0,
                    ]),
                    'registration' => app(RegistrationService::class)->registrationSummaryForPeriod($registration, $queue),
                ];
            })
            ->values();

        return Inertia::render('Student/Register', [
            'periods' => $periods,
            'student_gender' => $mahasiswa?->gender,
            'student_academic' => $mahasiswa ? [
                'sks_completed' => $mahasiswa->sks_completed,
                'is_bta_ppi_passed' => $mahasiswa->is_bta_ppi_passed,
                'has_health_certificate' => !!$mahasiswa->health_certificate_path,
                'has_parent_permission' => !!$mahasiswa->parent_permission_path,
                'parent_permission_template' => asset('templates/surat_izin_orang_tua.docx'),
                'min_sks' => (int) \App\Models\KKN\SystemSetting::get('min_sks_registration', 100),
            ] : null,
        ]);
    }

    public function store(
        StoreRegistrationRequest $request,
        RegistrationService $registrationService
    ): RedirectResponse
    {
        $user = $request->user();
        $mahasiswa = $user?->mahasiswa;

        if (! $mahasiswa) {
            return redirect()->back()->with('error', 'Profil mahasiswa belum ditemukan.');
        }

        // Handle Health Certificate Upload with Cleaning
        if ($request->hasFile('health_certificate')) {
            if ($mahasiswa->health_certificate_path) {
                Storage::disk('public')->delete($mahasiswa->health_certificate_path);
            }
            $path = $request->file('health_certificate')->store('health-certificates', 'public');
            $mahasiswa->update(['health_certificate_path' => $path]);
        }

        // Handle Parent Permission Upload with Cleaning
        if ($request->hasFile('parent_permission')) {
            if ($mahasiswa->parent_permission_path) {
                Storage::disk('public')->delete($mahasiswa->parent_permission_path);
            }
            $path = $request->file('parent_permission')->store('parent-permissions', 'public');
            $mahasiswa->update(['parent_permission_path' => $path]);
        }

        try {
            $registrationService->register(
                $mahasiswa,
                (int) $request->input('period_id'),
                $request->input('kelompok_id') ? (int) $request->input('kelompok_id') : null,
                $request->input('notes')
            );
            return redirect()->back()->with('success', 'Pendaftaran atau pilihan kelompok berhasil diperbarui.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['period_id' => $e->getMessage()]);
        }
    }

    public function leaveGroup(
        int $periodId,
        RegistrationService $registrationService
    ): RedirectResponse
    {
        $user = auth()->user();
        $periode = Periode::findOrFail($periodId);

        if (! $user?->mahasiswa) {
            return redirect()->back()->with('error', 'Profil mahasiswa belum ditemukan.');
        }

        // Check if student has active registration in this period
        $existingRegistration = \App\Models\KKN\PesertaKkn::where('mahasiswa_id', $user->mahasiswa->id)
            ->where('period_id', $periodId)
            ->whereIn('status', ['pending', 'approved'])
            ->first();

        if (!$existingRegistration) {
            return redirect()->back()->with('error', 'Anda tidak memiliki pendaftaran aktif di periode ini.');
        }

        $registrationService->leaveGroup($user->mahasiswa, $periode->id);

        return redirect()->back()->with('success', 'Anda telah keluar dari kelompok dan kembali ke antrian.');
    }
}
