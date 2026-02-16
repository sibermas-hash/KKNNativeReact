<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StoreRegistrationRequest;
use App\Models\KKN\Periode;
use App\Services\RegistrationService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RegistrationController extends Controller
{
    public function create(): Response
    {
        $today = now()->toDateString();

        $periods = Periode::query()
            ->where('is_active', true)
            ->whereDate('registration_start', '<=', $today)
            ->whereDate('registration_end', '>=', $today)
            ->with(['kelompok' => function ($query) {
                $query->where('status', 'active')
                    ->with('lokasi')
                    ->withCount(['peserta' => function ($q) {
                        $q->whereIn('status', ['pending', 'approved']);
                    }]);
            }])
            ->orderByDesc('registration_start')
            ->get();

        return Inertia::render('Student/Register', [
            'periods' => $periods,
        ]);
    }

    public function store(
        StoreRegistrationRequest $request,
        RegistrationService $registrationService
    ): RedirectResponse
    {
        $user = $request->user();

        if (! $user?->mahasiswa) {
            return redirect()->back()->with('error', 'Profil mahasiswa belum ditemukan.');
        }

        $registrationService->register(
            $user->mahasiswa,
            (int) $request->input('period_id'),
            $request->input('kelompok_id') ? (int) $request->input('kelompok_id') : null,
            $request->input('notes')
        );

        return redirect()->back()->with('success', 'Pendaftaran berhasil disimpan.');
    }
}