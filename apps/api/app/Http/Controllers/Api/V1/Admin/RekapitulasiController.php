<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\RekapitulasiKegiatan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RekapitulasiController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $kelompokId = $request->integer('kelompok_id');

        if ($kelompokId) {
            $kelompok = KelompokKkn::with(['lokasi', 'periode', 'dosen'])->findOrFail($kelompokId);

            $rekapitulasi = RekapitulasiKegiatan::where('kelompok_id', $kelompokId)
                ->orderBy('uraian_kegiatan')
                ->get();

            return $this->success([
                'kelompok' => [
                    'id'            => $kelompok->id,
                    'nama_kelompok' => $kelompok->nama_kelompok,
                    'lokasi'        => $kelompok->lokasi ? [
                        'village_name'  => $kelompok->lokasi->village_name,
                        'district_name' => $kelompok->lokasi->district_name,
                        'regency_name'  => $kelompok->lokasi->regency_name,
                    ] : null,
                    'periode'       => $kelompok->periode ? ['name' => $kelompok->periode->name] : null,
                ],
                'rekapitulasi' => $rekapitulasi,
                'dpl'          => $kelompok->dosen ? ['nama' => $kelompok->dosen->nama] : null,
            ]);
        }

        // Daftar semua kelompok yang punya rekapitulasi
        $kelompokList = KelompokKkn::with(['lokasi', 'periode'])
            ->whereHas('rekapitulasiKegiatan')
            ->orderBy('nama_kelompok')
            ->get()
            ->map(fn ($k) => [
                'id'              => $k->id,
                'nama_kelompok'   => $k->nama_kelompok,
                'desa'            => $k->lokasi?->village_name,
                'kecamatan'       => $k->lokasi?->district_name,
                'periode'         => $k->periode?->name,
                'total_dana'      => $k->rekapitulasiKegiatan()->sum('jumlah'),
                'jumlah_kegiatan' => $k->rekapitulasiKegiatan()->count(),
            ]);

        return $this->success(['kelompok_list' => $kelompokList]);
    }
}
