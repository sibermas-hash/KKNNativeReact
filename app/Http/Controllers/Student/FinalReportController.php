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
        $mahasiswa = auth()->user()->mahasiswa;
        $pendaftaran = $mahasiswa?->peserta()->where('status', 'approved')->first();
        $laporanAda = $mahasiswa
            ? LaporanAkhir::where('mahasiswa_id', $mahasiswa->id)->latest()->first()
            : null;

        return Inertia::render('Student/FinalReport/Create', [
            'group' => $pendaftaran?->kelompok,
            'existingReport' => $laporanAda,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $mahasiswa = auth()->user()->mahasiswa;
        $pendaftaran = $mahasiswa->peserta()->where('status', 'approved')->first();
        abort_if(!$pendaftaran || !$pendaftaran->kelompok_id, 403);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:300'],
            'abstract' => ['nullable', 'string'],
            'file' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:20480'],
        ]);

        $file = $request->file('file');
        $path = $file->store('final-reports', 'public');

        LaporanAkhir::updateOrCreate(
            ['mahasiswa_id' => $mahasiswa->id, 'kelompok_id' => $pendaftaran->kelompok_id],
            [
                'title' => $validated['title'],
                'abstract' => $validated['abstract'] ?? null,
                'file_path' => $path,
                'file_name' => $file->getClientOriginalName(),
                'status' => 'submitted',
                'submitted_at' => now(),
            ],
        );

        return redirect()->route('student.dashboard')
            ->with('success', 'Laporan akhir berhasil dikirim.');
    }
}
