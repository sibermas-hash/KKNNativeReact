<?php

namespace App\Http\Controllers\Dpl;

use App\Http\Controllers\Controller;
use App\Models\KKN\KelompokKkn;
use Inertia\Inertia;
use Inertia\Response;

class GroupController extends Controller
{
    public function index(): Response
    {
        $dosen = auth()->user()->dosen;

        $kelompok = $dosen
            ? KelompokKkn::where('dpl_id', $dosen->id)
                ->with(['periode', 'lokasi'])
                ->withCount(['registrations', 'dailyReports', 'workPrograms'])
                ->get()
            : collect();

        return Inertia::render('Dpl/Groups/Index', [
            'groups' => $kelompok,
        ]);
    }

    public function show(KelompokKkn $group): Response
    {
        $dosen = auth()->user()->dosen;
        abort_if(!$dosen || $group->dpl_id !== $dosen->id, 403);

        $group->load([
            'periode', 'lokasi',
            'registrations.mahasiswa.faculty',
            'registrations.mahasiswa.prodi',
            'workPrograms',
        ]);

        return Inertia::render('Dpl/Groups/Show', [
            'group' => $group,
        ]);
    }
}
