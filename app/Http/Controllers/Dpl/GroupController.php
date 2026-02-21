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
        abort_if(!$dosen, 403, 'Data dosen tidak ditemukan.');

        $groupIds = $dosen->kelompokKkn()->pluck('kelompok_kkn.id');

        $kelompok = KelompokKkn::whereIn('id', $groupIds)
            ->with(['periode', 'lokasi'])
            ->withCount(['peserta', 'kegiatan', 'programKerja'])
            ->get();

        return Inertia::render('Dpl/Groups/Index', [
            'groups' => $kelompok,
        ]);
    }

    public function show(KelompokKkn $group): Response
    {
        $dosen = auth()->user()->dosen;
        abort_if(!$dosen, 403, 'Data dosen tidak ditemukan.');
        $groupIds = $dosen->kelompokKkn()->pluck('kelompok_kkn.id');
        abort_if(!$groupIds->contains($group->id), 403, 'Anda tidak memiliki akses ke kelompok ini.');

        $group->load([
            'periode', 'lokasi',
            'peserta.mahasiswa.fakultas',
            'peserta.mahasiswa.prodi',
            'programKerja',
        ]);

        return Inertia::render('Dpl/Groups/Show', [
            'group' => $group,
        ]);
    }
}
