<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Registration;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RegistrationController extends Controller
{
    public function index(Request $request): Response
    {
        $registrations = Registration::with('student.faculty', 'student.program', 'period', 'group')
            ->when($request->input('status'), fn ($q, $status) => $q->where('status', $status))
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Registrations/Index', [
            'registrations' => $registrations,
            'filters' => $request->only('status'),
        ]);
    }

    public function show(Registration $registration): Response
    {
        $registration->load('student.faculty', 'student.program', 'period', 'group', 'documents');

        return Inertia::render('Admin/Registrations/Show', [
            'registration' => $registration,
        ]);
    }

    public function approve(Registration $registration): RedirectResponse
    {
        $registration->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Pendaftaran berhasil disetujui.');
    }

    public function reject(Request $request, Registration $registration): RedirectResponse
    {
        $validated = $request->validate([
            'notes' => ['required', 'string', 'max:1000'],
        ]);

        $registration->update([
            'status' => 'rejected',
            'notes' => $validated['notes'],
        ]);

        return redirect()->back()->with('success', 'Pendaftaran ditolak.');
    }

    public function assignGroup(Request $request, Registration $registration): RedirectResponse
    {
        $validated = $request->validate([
            'group_id' => ['required', 'exists:groups,id'],
        ]);

        $registration->update([
            'group_id' => $validated['group_id'],
        ]);

        return redirect()->back()->with('success', 'Mahasiswa berhasil ditempatkan ke kelompok.');
    }
}
