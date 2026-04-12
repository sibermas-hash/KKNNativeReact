<?php

declare(strict_types=1);

namespace App\Http\Controllers\Dpl;

use App\Http\Controllers\Controller;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\MonitoringDpl;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MonitoringController extends Controller
{
    public function index(): Response
    {
        $dosen = auth()->user()->dosen;
        abort_if(! $dosen, 403, 'Data dosen tidak ditemukan.');

        $groupIds = $dosen->kelompokKkn()->pluck('kelompok_kkn.id');

        $monitorings = MonitoringDpl::whereIn('kelompok_id', $groupIds)
            ->with(['kelompok', 'periode'])
            ->orderByDesc('tanggal_kunjungan')
            ->paginate(20);

        // Statistik monitoring per kelompok
        $statsPerKelompok = MonitoringDpl::whereIn('kelompok_id', $groupIds)
            ->selectRaw('kelompok_id, COUNT(*) as total, MAX(tanggal_kunjungan) as terakhir')
            ->groupBy('kelompok_id')
            ->get()
            ->keyBy('kelompok_id');

        $groups = KelompokKkn::whereIn('id', $groupIds)
            ->with(['periode'])
            ->get()
            ->map(function ($group) use ($statsPerKelompok) {
                $stat = $statsPerKelompok->get($group->id);

                return [
                    'id' => $group->id,
                    'nama' => $group->nama_kelompok,
                    'periode' => $group->periode?->name,
                    'total_monitoring' => $stat?->total ?? 0,
                    'terakhir_monitoring' => $stat?->terakhir ? now()->parse($stat->terakhir)->format('d/m/Y') : 'Belum pernah',
                ];
            });

        return Inertia::render('Dpl/Monitoring/Index', [
            'monitorings' => $monitorings,
            'groups' => $groups,
        ]);
    }

    public function create(Request $request): Response
    {
        $dosen = auth()->user()->dosen;
        abort_if(! $dosen, 403, 'Data dosen tidak ditemukan.');

        $groupIds = $dosen->kelompokKkn()->pluck('kelompok_kkn.id');
        $groups = KelompokKkn::whereIn('id', $groupIds)
            ->with(['periode'])
            ->get();

        $selectedGroupId = $request->input('kelompok_id');

        return Inertia::render('Dpl/Monitoring/Create', [
            'groups' => $groups,
            'selectedGroupId' => $selectedGroupId,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $dosen = auth()->user()->dosen;
        abort_if(! $dosen, 403, 'Data dosen tidak ditemukan.');

        $validated = $request->validate([
            'kelompok_id' => ['required', 'exists:kelompok_kkn,id'],
            'tanggal_kunjungan' => ['required', 'date'],
            'permasalahan' => ['required', 'string', 'min:50'],
            'solusi' => ['required', 'string', 'min:50'],
            'catatan_tambahan' => ['nullable', 'string'],
        ]);

        // Verify DPL owns this group
        $ownsGroup = $dosen->kelompokKkn()
            ->where('kelompok_kkn.id', $validated['kelompok_id'])
            ->exists();
        abort_unless($ownsGroup, 403, 'Anda tidak membimbing kelompok ini.');

        $kelompok = KelompokKkn::find($validated['kelompok_id']);

        MonitoringDpl::create([
            'dpl_id' => $dosen->id,
            'kelompok_id' => $validated['kelompok_id'],
            'periode_id' => $kelompok->period_id,
            'tanggal_kunjungan' => $validated['tanggal_kunjungan'],
            'permasalahan' => $validated['permasalahan'],
            'solusi' => $validated['solusi'],
            'catatan_tambahan' => $validated['catatan_tambahan'],
        ]);

        return redirect()->route('dpl.monitoring.index')
            ->with('success', 'Laporan monitoring berhasil disimpan.');
    }
}
