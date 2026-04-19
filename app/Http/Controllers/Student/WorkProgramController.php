<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\KKN\ProgramKerja;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkProgramController extends Controller
{
    public function index(): Response
    {
        $mahasiswa = auth()->user()->mahasiswa;
        $pendaftaran = $mahasiswa?->peserta()->where('status', 'approved')->first();

        $programKerja = $pendaftaran && $pendaftaran->kelompok_id
            ? ProgramKerja::where('kelompok_id', $pendaftaran->kelompok_id)
                ->orderByDesc('created_at')
                ->get()
            : collect();

        return Inertia::render('Student/WorkPrograms/Index', [
            'workPrograms' => $programKerja,
            'canCreate' => $pendaftaran && $pendaftaran->kelompok_id,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Student/WorkPrograms/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $mahasiswa = auth()->user()->mahasiswa;
        $pendaftaran = $mahasiswa->peserta()->where('status', 'approved')->first();
        
        if (! $pendaftaran || ! $pendaftaran->kelompok_id) {
            return redirect()->back()->with('error', 'Tindakan ditolak: Anda belum ditempatkan ke dalam kelompok.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'objectives' => ['nullable', 'string'],
            'target_participants' => ['nullable', 'integer', 'min:1'],
            'budget' => ['required', 'numeric', 'min:0'],
            'kategori' => ['required', 'in:unggulan,pendukung'],
        ]);

        ProgramKerja::create([
            'kelompok_id' => $pendaftaran->kelompok_id,
            ...$validated,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        return redirect()->route('student.program-kerja.index')
            ->with('success', 'Program kerja berhasil diajukan.');
    }
}
