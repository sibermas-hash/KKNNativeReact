<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\RekapitulasiKegiatan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RekapitulasiController extends Controller
{
    public function index(Request $request): Response
    {
        $kelompokId = $request->integer('kelompok_id');

        if ($kelompokId) {
            $kelompok = KelompokKkn::with(['lokasi', 'periode', 'dosen'])
                ->findOrFail($kelompokId);

            $rekapitulasi = RekapitulasiKegiatan::where('kelompok_id', $kelompokId)
                ->orderBy('uraian_kegiatan')
                ->get();

            return Inertia::render('Admin/Website/Rekapitulasi/Index', [
                'kelompok' => [
                    'id' => $kelompok->id,
                    'nama_kelompok' => $kelompok->nama_kelompok,
                    'lokasi' => $kelompok->lokasi ? [
                        'village_name' => $kelompok->lokasi->village_name,
                        'district_name' => $kelompok->lokasi->district_name,
                        'regency_name' => $kelompok->lokasi->regency_name,
                    ] : null,
                    'periode' => $kelompok->periode ? [
                        'name' => $kelompok->periode->name,
                    ] : null,
                ],
                'rekapitulasi' => $rekapitulasi,
                'dpl' => $kelompok->dosen ? [
                    'nama' => $kelompok->dosen->nama,
                ] : null,
            ]);
        }

        // Show list of all kelompok with rekapitulasi
        $kelompokList = KelompokKkn::with(['lokasi', 'periode'])
            ->whereHas('rekapitulasiKegiatan')
            ->orderBy('nama_kelompok')
            ->get()
            ->map(function ($kelompok) {
                $total = $kelompok->rekapitulasiKegiatan()->sum('jumlah');

                return [
                    'id' => $kelompok->id,
                    'nama_kelompok' => $kelompok->nama_kelompok,
                    'desa' => $kelompok->lokasi?->village_name,
                    'kecamatan' => $kelompok->lokasi?->district_name,
                    'periode' => $kelompok->periode?->name,
                    'total_dana' => $total,
                    'jumlah_kegiatan' => $kelompok->rekapitulasiKegiatan()->count(),
                ];
            });

        return Inertia::render('Admin/Website/Rekapitulasi/List', [
            'kelompokList' => $kelompokList,
        ]);
    }
}
