<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\RekapitulasiKegiatan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RekapitulasiController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $mahasiswa = auth()->user()->mahasiswa;
        abort_if(! $mahasiswa, 403, 'Data mahasiswa tidak ditemukan.');

        $peserta = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
            ->where('status', 'approved')
            ->with(['kelompok.lokasi', 'kelompok.periode'])
            ->first();

        abort_if(! $peserta?->kelompok, 403, 'Anda belum memiliki kelompok KKN aktif.');

        $rekapitulasi = RekapitulasiKegiatan::where('kelompok_id', $peserta->kelompok_id)
            ->orderBy('uraian_kegiatan')
            ->get();

        return $this->success([
            'kelompok' => [
                'id' => $peserta->kelompok->id,
                'nama_kelompok' => $peserta->kelompok->nama_kelompok,
                'lokasi' => $peserta->kelompok->lokasi ? [
                    'village_name' => $peserta->kelompok->lokasi->village_name,
                    'district_name' => $peserta->kelompok->lokasi->district_name,
                    'regency_name' => $peserta->kelompok->lokasi->regency_name,
                ] : null,
                'periode' => $peserta->kelompok->periode?->name,
            ],
            'rekapitulasi' => $rekapitulasi,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $mahasiswa = auth()->user()->mahasiswa;
        abort_if(! $mahasiswa, 403, 'Data mahasiswa tidak ditemukan.');

        $peserta = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
            ->where('status', 'approved')
            ->first();

        abort_if(! $peserta?->kelompok_id, 403, 'Anda belum memiliki kelompok KKN aktif.');

        $validated = $request->validate([
            'uraian_kegiatan'    => ['required', 'string', 'max:500'],
            'volume'             => ['nullable', 'integer', 'min:0'],
            'satuan'             => ['nullable', 'string', 'max:50'],
            'swadaya_mhs'        => ['nullable', 'integer', 'min:0'],
            'swadaya_masyarakat' => ['nullable', 'integer', 'min:0'],
            'bantuan_pemerintah' => ['nullable', 'integer', 'min:0'],
            'donatur_lain'       => ['nullable', 'integer', 'min:0'],
            'jumlah'             => ['nullable', 'integer', 'min:0'],
            'keterangan'         => ['nullable', 'string'],
        ]);

        $rekap = RekapitulasiKegiatan::updateOrCreate(
            [
                'kelompok_id' => $peserta->kelompok_id,
                'uraian_kegiatan' => $validated['uraian_kegiatan'],
            ],
            array_merge($validated, ['kelompok_id' => $peserta->kelompok_id])
        );

        return $this->created($rekap, 'Rekapitulasi kegiatan berhasil disimpan.');
    }
}
