<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\Periode;
use App\Services\YudisiumService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class YudisiumController extends Controller
{
    public function __construct(
        protected YudisiumService $yudisiumService
    ) {}

    public function index(Request $request): Response
    {
        $periodeId = $request->input('periode_id');

        $periodes = Periode::orderByDesc('start_date')->get();

        $rekap = null;
        if ($periodeId) {
            $rekap = $this->yudisiumService->generateRekapYudisium((int) $periodeId);
        }

        return Inertia::render('Admin/Academic/Yudisium/Index', [
            'periodes' => $periodes,
            'rekap' => $rekap,
            'selectedPeriodeId' => $periodeId,
        ]);
    }

    public function proses(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'periode_id' => ['required', 'exists:periode,id'],
        ]);

        $hasil = $this->yudisiumService->prosesYudisiumPeriode((int) $validated['periode_id']);

        return redirect()->back()
            ->with('success', "Proses yudisium selesai. Total: {$hasil['total']}, Lulus: {$hasil['lulus']}, Tidak Lulus: {$hasil['tidak_lulus']}");
    }
}
