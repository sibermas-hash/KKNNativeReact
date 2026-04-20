<?php

declare(strict_types=1);

namespace App\Http\Controllers\Dosen;

use App\Http\Controllers\Controller;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaWorkshop;
use App\Models\KKN\Workshop;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        $dosen = $user->dosen;

        // Status workshop: apakah sudah lulus?
        $workshopStatus = PesertaWorkshop::where('user_id', $user->id)
            ->with('workshop:id,title,workshop_date')
            ->latest('registered_at')
            ->first();

        $hasPassedWorkshop = $workshopStatus?->is_passed ?? false;

        // Status pendaftaran DPL
        $dplRegistration = $dosen
            ? DplPeriod::where('dosen_id', $dosen->id)
                ->with('periode:id,name')
                ->latest()
                ->first()
            : null;

        // Periode yang sedang buka pendaftaran
        $availablePeriods = Periode::where('is_active', true)
            ->whereIn('current_phase', ['registration', 'placement'])
            ->select('id', 'name', 'current_phase', 'registration_start', 'registration_end')
            ->get();

        // Workshop yang tersedia
        $availableWorkshops = Workshop::where('status', 'open')
            ->select('id', 'title', 'workshop_date', 'location', 'max_participants')
            ->withCount('peserta')
            ->get();

        return Inertia::render('Dosen/Dashboard', [
            'dosen' => $dosen ? [
                'id' => $dosen->id,
                'nip' => $dosen->nip,
                'nama' => $dosen->nama,
                'fakultas' => $dosen->fakultas?->nama,
            ] : null,
            'workshop_status' => $workshopStatus ? [
                'has_registered' => true,
                'is_passed' => $workshopStatus->is_passed,
                'attendance_status' => $workshopStatus->attendance_status,
                'workshop_title' => $workshopStatus->workshop?->title,
                'workshop_date' => $workshopStatus->workshop?->workshop_date?->format('d/m/Y'),
            ] : [
                'has_registered' => false,
                'is_passed' => false,
            ],
            'dpl_registration' => $dplRegistration ? [
                'status' => $dplRegistration->status,
                'periode_name' => $dplRegistration->periode?->name,
                'is_active' => $dplRegistration->is_active,
                'rejection_reason' => $dplRegistration->rejection_reason,
            ] : null,
            'available_periods' => $availablePeriods,
            'available_workshops' => $availableWorkshops->map(fn ($w) => [
                'id' => $w->id,
                'title' => $w->title,
                'date' => $w->workshop_date?->format('d/m/Y'),
                'location' => $w->location,
                'slots_left' => max(0, ($w->max_participants ?? 0) - $w->peserta_count),
            ]),
            'has_passed_workshop' => $hasPassedWorkshop,
        ]);
    }
}
