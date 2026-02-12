<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\PesertaKkn;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PesertaKknController extends Controller
{
    public function index(Request $request): Response
    {
        $registrations = PesertaKkn::with('mahasiswa.fakultas', 'mahasiswa.prodi', 'periode', 'kelompok')
            ->when($request->input('status'), fn ($q, $status) => $q->where('status', $status))
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Registrations/Index', [
            'registrations' => $registrations,
            'filters' => $request->only('status'),
        ]);
    }

    public function show(PesertaKkn $registration): Response
    {
        $registration->load('mahasiswa.fakultas', 'mahasiswa.prodi', 'periode', 'kelompok', 'documents');

        return Inertia::render('Admin/Registrations/Show', [
            'registration' => $registration,
        ]);
    }

    public function approve(PesertaKkn $registration): RedirectResponse
    {
        $registration->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Pendaftaran berhasil disetujui.');
    }

    public function reject(Request $request, PesertaKkn $registration): RedirectResponse
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

    public function assignGroup(Request $request, PesertaKkn $registration): RedirectResponse
    {
        $validated = $request->validate([
            'kelompok_id' => ['required', 'exists:kelompok_kkn,id'],
        ]);

        $registration->update([
            'kelompok_id' => $validated['kelompok_id'],
        ]);

        return redirect()->back()->with('success', 'Mahasiswa berhasil ditempatkan ke kelompok.');
    }
}
