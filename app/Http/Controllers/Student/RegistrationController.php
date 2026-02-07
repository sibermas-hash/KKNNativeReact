<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StoreRegistrationRequest;
use App\Models\Period;
use App\Services\RegistrationService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RegistrationController extends Controller
{
    public function create(): Response
    {
        $today = now()->toDateString();

        $periods = Period::query()
            ->select(['id', 'name', 'registration_start', 'registration_end'])
            ->where('is_active', true)
            ->whereDate('registration_start', '<=', $today)
            ->whereDate('registration_end', '>=', $today)
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

        if (! $user?->student) {
            return redirect()->back()->with('error', 'Profil mahasiswa belum ditemukan.');
        }

        $registrationService->register(
            $user->student,
            (int) $request->input('period_id'),
            $request->input('notes')
        );

        return redirect()->back()->with('success', 'Pendaftaran berhasil disimpan.');
    }
}
