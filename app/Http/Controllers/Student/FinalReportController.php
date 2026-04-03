<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\KKN\LaporanAkhir;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinalReportController extends Controller
{
    public function create(): Response
    {
        $mahasiswa = auth()->user()?->mahasiswa;
        $pendaftaran = $mahasiswa?->peserta()->where('status', 'approved')->first();
        
        // Check if student is the leader of the group
        $isLeader = $pendaftaran && $pendaftaran->role === 'Ketua';

        $laporanAda = $pendaftaran
            ? LaporanAkhir::where('kelompok_id', $pendaftaran->kelompok_id)->latest()->first()
            : null;

        return Inertia::render('Student/FinalReport/Create', [
            'group' => $pendaftaran?->kelompok,
            'existingReport' => $laporanAda,
            'isLeader' => $isLeader,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $mahasiswa = auth()->user()?->mahasiswa;
        abort_if(!$mahasiswa, 403, 'Profil mahasiswa tidak ditemukan.');
        
        $pendaftaran = $mahasiswa->peserta()->where('status', 'approved')->first();
        
        abort_if(!$pendaftaran || !$pendaftaran->kelompok_id, 403, 'Anda belum terdaftar dalam kelompok.');
        abort_if($pendaftaran->role !== 'Ketua', 403, 'Hanya Ketua Kelompok yang diizinkan mengunggah Laporan Akhir.');

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:300'],
            'abstract' => ['nullable', 'string'],
            'file' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:20480'],
        ]);

        $file = $request->file('file');
        $path = $file->store('final-reports', 'public');

        LaporanAkhir::updateOrCreate(
            ['kelompok_id' => $pendaftaran->kelompok_id],
            [
                'mahasiswa_id' => $mahasiswa->id, // Who uploaded it
                'title' => $validated['title'],
                'abstract' => $validated['abstract'] ?? null,
                'file_path' => $path,
                'file_name' => $file->getClientOriginalName(),
                'status' => 'submitted',
                'submitted_at' => now(),
            ],
        );

        return redirect()->route('student.dashboard')
            ->with('success', 'Laporan akhir kelompok berhasil dikirim.');
    }
}
