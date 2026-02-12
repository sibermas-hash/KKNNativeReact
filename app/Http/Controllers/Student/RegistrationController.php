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

        $periode = Periode::query()
            ->select(['id', 'nama', 'registration_start', 'registration_end'])
            ->where('is_active', true)
            ->whereDate('registration_start', '<=', $today)
            ->whereDate('registration_end', '>=', $today)
            ->orderByDesc('registration_start')
            ->get();

        return Inertia::render('Student/Register', [
            'periods' => $periode,
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
            $request->input('notes')
        );

        return redirect()->back()->with('success', 'Pendaftaran berhasil disimpan.');
    }
}
