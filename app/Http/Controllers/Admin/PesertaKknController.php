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

        // Map data to match React frontend expectations
        $registrations->through(function ($reg) {
            return [
                'id' => $reg->id,
                'status' => $reg->status,
                'registration_date' => $reg->registration_date,
                'student' => [
                    'nim' => $reg->mahasiswa?->nim,
                    'name' => $reg->mahasiswa?->nama ?? $reg->mahasiswa?->user?->name ?? '-',
                    'faculty' => $reg->mahasiswa?->fakultas ? ['name' => $reg->mahasiswa->fakultas->nama] : null,
                    'program' => $reg->mahasiswa?->prodi ? ['name' => $reg->mahasiswa->prodi->nama] : null,
                ],
                'period' => $reg->periode ? ['name' => $reg->periode->name] : ['name' => '-'],
                'group' => $reg->kelompok ? ['name' => $reg->kelompok->nama_kelompok] : null,
            ];
        });

        return Inertia::render('Admin/Registrations/Index', [
            'registrations' => $registrations,
            'filters' => $request->only('status'),
        ]);
    }

    public function show(PesertaKkn $registration): Response
    {
        $registration->load('mahasiswa.fakultas', 'mahasiswa.prodi', 'periode', 'kelompok', 'dokumen');

        return Inertia::render('Admin/Registrations/Show', [
            'registration' => $registration,
        ]);
    }

    public function approve(PesertaKkn $registration): RedirectResponse
    {
        // Proteksi: Cek Kapasitas Kelompok jika mahasiswa sudah diplot ke kelompok
        if ($registration->kelompok_id) {
            $kelompok = $registration->kelompok()->withCount(['peserta' => function ($q) {
                $q->where('status', 'approved');
            }])->first();

            if ($kelompok && $kelompok->peserta_count >= $kelompok->capacity) {
                return redirect()->back()->withErrors(['error' => "Gagal menyetujui. Kelompok {$kelompok->nama_kelompok} sudah mencapai batas maksimal kapasitas ({$kelompok->capacity})."]);
            }
        }

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

        // Proteksi: Cek Kapasitas Kelompok Tujuan
        $kelompok = \App\Models\KKN\KelompokKkn::withCount(['peserta' => function ($q) {
            $q->where('status', 'approved');
        }])->find($validated['kelompok_id']);

        if ($kelompok && $kelompok->peserta_count >= $kelompok->capacity) {
            return redirect()->back()->withErrors(['error' => "Gagal menempatkan. Kelompok tujuan {$kelompok->nama_kelompok} sudah penuh."]);
        }

        $registration->update([
            'kelompok_id' => $validated['kelompok_id'],
            'role' => 'Anggota', // Reset to Anggota when moving group
        ]);

        return redirect()->back()->with('success', 'Mahasiswa berhasil ditempatkan ke kelompok.');
    }

    public function makeLeader(PesertaKkn $registration): RedirectResponse
    {
        // Fix: Validate student is approved and in a group
        if (!$registration->kelompok_id) {
            return redirect()->back()->withErrors(['error' => 'Mahasiswa harus ditempatkan di kelompok terlebih dahulu.']);
        }
        
        if ($registration->status !== 'approved') {
            return redirect()->back()->withErrors(['error' => 'Hanya mahasiswa yang sudah disetujui yang dapat menjadi ketua kelompok.']);
        }

        // Reset all other members in the SAME group to 'Anggota'
        PesertaKkn::where('kelompok_id', $registration->kelompok_id)
            ->where('id', '!=', $registration->id)
            ->update(['role' => 'Anggota']);

        // Set this student as 'Ketua'
        $registration->update(['role' => 'Ketua']);

        return redirect()->back()->with('success', "{$registration->mahasiswa->nama} kini resmi menjadi Ketua Kelompok.");
    }
}
