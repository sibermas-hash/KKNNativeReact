<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StoreRegistrationRequest;
use App\Models\KKN\AntrianKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\SystemSetting;
use App\Services\GroupSelectionService;
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
        GroupSelectionService $groupSelectionService
    ): Response {
        $today = now()->toDateString();
        $mahasiswa = auth()->user()?->mahasiswa;

        $periodModels = Periode::query()
            ->where('is_active', true)
            ->whereDate('registration_start', '<=', $today)
            ->whereDate('registration_end', '>=', $today)
            ->with(['kelompok' => function ($query) {
                $query->where('status', 'active')
                    ->with(['lokasi', 'slotTerkunci.fakultas', 'slotTerkunci.prodi'])
                    ->withCount([
                        'peserta' => function ($participantQuery) {
                            $participantQuery->whereIn('status', ['pending', 'document_submitted', 'approved']);
                        },
                        'peserta as male_member_count' => function ($participantQuery) {
                            $participantQuery->whereIn('status', ['pending', 'document_submitted', 'approved'])
                                ->whereHas('mahasiswa', function ($studentQuery) {
                                    $studentQuery->where('gender', 'L');
                                });
                        },
                        'peserta as female_member_count' => function ($participantQuery) {
                            $participantQuery->whereIn('status', ['pending', 'document_submitted', 'approved'])
                                ->whereHas('mahasiswa', function ($studentQuery) {
                                    $studentQuery->where('gender', 'P');
                                });
                        },
                    ]);
            }])
            ->orderByDesc('registration_start')
            ->get();

        $periodIds = $periodModels->pluck('id');

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

        $periods = $periodModels
            ->map(function (Periode $period) use ($registrations, $queues, $registrationService, $groupSelectionService) {
                return [
                    'id' => $period->id,
                    'nama' => $period->name,
                    'registration_start' => optional($period->registration_start)->format('Y-m-d'),
                    'registration_end' => optional($period->registration_end)->format('Y-m-d'),
                    'kelompok' => $period->kelompok->map(function ($group) use ($groupSelectionService) {
                        $maleQuota = $groupSelectionService->maleQuotaRange((int) $group->capacity);
                        $maleMemberCount = (int) ($group->male_member_count ?? 0);

                        return [
                            'id' => $group->id,
                            'nama_kelompok' => $group->nama_kelompok,
                            'capacity' => (int) $group->capacity,
                            'peserta_count' => (int) ($group->peserta_count ?? 0),
                            'remaining_seats' => max((int) $group->capacity - (int) ($group->peserta_count ?? 0), 0),
                            'male_member_count' => $maleMemberCount,
                            'female_member_count' => (int) ($group->female_member_count ?? 0),
                            'male_min_required' => $maleQuota['minimum'],
                            'male_target_maximum' => $maleQuota['maximum'],
                            'requires_more_male_members' => $maleMemberCount < $maleQuota['minimum'],
                            'male_target_reached' => $maleMemberCount >= $maleQuota['maximum'],
                            'male_target_exceeded' => $maleMemberCount > $maleQuota['maximum'],
                            'male_min_percentage' => $groupSelectionService->maleMinimumPercent(),
                            'male_target_percentage' => $groupSelectionService->maleTargetPercent(),
                            'reserved_male_slots' => max($maleQuota['minimum'] - $maleMemberCount, 0),
                            'slot_terkunci' => $group->slotTerkunci->map(function ($slot) {
                                return [
                                    'id' => $slot->id,
                                    'tipe_slot' => $slot->tipe_slot,
                                    'label' => match ($slot->tipe_slot) {
                                        'fakultas' => 'Fakultas ' . ($slot->fakultas?->nama ?? 'tidak diketahui'),
                                        'prodi' => 'Program Studi ' . ($slot->prodi?->nama ?? 'tidak diketahui'),
                                        default => 'Slot terkunci',
                                    },
                                    'kuota_slot' => (int) $slot->kuota_slot,
                                ];
                            })->values(),
                            'lokasi' => $group->lokasi ? [
                                'id' => $group->lokasi->id,
                                'village_name' => $group->lokasi->village_name,
                                'district_name' => $group->lokasi->district_name,
                                'regency_name' => $group->lokasi->regency_name,
                                'full_name' => $group->lokasi->full_name,
                            ] : null,
                        ];
                    })->values(),
                    'registration' => $registrationService->registrationSummaryForPeriod(
                        $registrations->get($period->id),
                        $queues->get($period->id),
                    ),
                ];
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
                Storage::disk('public')->delete($mahasiswa->health_certificate_path);
            }

            // VULN-013 Fix: Store sensitive documents in private storage
            $path = $request->file('health_certificate')->store('health-certificates', 'local');
            $mahasiswa->update(['health_certificate_path' => $path]);
        }

        if ($request->hasFile('parent_permission')) {
            if ($mahasiswa->parent_permission_path) {
                Storage::disk('public')->delete($mahasiswa->parent_permission_path);
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
