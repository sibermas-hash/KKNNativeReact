<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\KKN\IzinMeninggalkan;
use App\Services\IzinService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IzinController extends Controller
{
    public function __construct(
        protected IzinService $izinService
    ) {}

    public function index(): Response
    {
        $mahasiswa = auth()->user()->mahasiswa;
        abort_if(! $mahasiswa, 403, 'Data mahasiswa tidak ditemukan.');

        $izins = IzinMeninggalkan::where('mahasiswa_id', $mahasiswa->id)
            ->with(['kelompok', 'diprosesOleh'])
            ->orderByDesc('created_at')
            ->paginate(15);

        return Inertia::render('Student/Izin/Index', [
            'izins' => $izins,
            'akumulasiTanpaKeterangan' => $this->izinService->hitungAkumulasiTanpaKeterangan($mahasiswa->id),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Student/Izin/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $mahasiswa = auth()->user();

        $validated = $request->validate([
            'tanggal_mulai' => ['required', 'date', 'after_or_equal:today'],
            'tanggal_kembali' => ['required', 'date', 'after_or_equal:tanggal_mulai'],
            'alasan' => ['required', 'string', 'max:1000'],
            'file_bukti' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:2048'],
        ]);

        if ($request->hasFile('file_bukti')) {
            $path = $request->file('file_bukti')->store('evidence/perizinan', 'local');
            $validated['file_bukti'] = $path;
        }

        $this->izinService->ajukanIzin($mahasiswa, $validated);

        return redirect()->route('student.izin.index')
            ->with('success', 'Permohonan izin berhasil diajukan.');
    }
}
