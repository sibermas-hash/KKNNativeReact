<?php

namespace App\Http\Controllers\Dpl;

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
        $dosen = auth()->user()->dosen;
        abort_if(!$dosen, 403, 'Data dosen tidak ditemukan.');

        $groupIds = $dosen->kelompokKkn()->pluck('kelompok_kkn.id');

        $izins = IzinMeninggalkan::whereIn('kelompok_id', $groupIds)
            ->with(['mahasiswa', 'kelompok'])
            ->orderBy('status')
            ->orderByDesc('created_at')
            ->paginate(20);

        return Inertia::render('Dpl/Izin/Index', [
            'izins' => $izins,
        ]);
    }

    public function approve(IzinMeninggalkan $izin): RedirectResponse
    {
        $dosen = auth()->user();
        $this->authorize('approve', $izin);

        $this->izinService->setujuiIzin($dosen, $izin);

        return redirect()->back()->with('success', 'Izin berhasil disetujui.');
    }

    public function reject(Request $request, IzinMeninggalkan $izin): RedirectResponse
    {
        $dosen = auth()->user();
        $this->authorize('approve', $izin);

        $validated = $request->validate([
            'catatan' => ['required', 'string', 'max:500'],
        ]);

        $this->izinService->tolakIzin($dosen, $izin, $validated['catatan']);

        return redirect()->back()->with('success', 'Izin berhasil ditolak.');
    }
}
