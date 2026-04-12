<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\RekapitulasiKegiatan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RekapitulasiController extends Controller
{
    public function index(): Response
    {
        $mahasiswa = auth()->user()->mahasiswa;
        abort_if(! $mahasiswa, 403, 'Data mahasiswa tidak ditemukan.');

        $peserta = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
            ->where('status', 'approved')
            ->with(['kelompok.lokasi', 'kelompok.periode', 'kelompok.dosen'])
            ->first();

        abort_if(! $peserta || ! $peserta->kelompok, 403, 'Anda belum memiliki kelompok KKN aktif.');

        $rekapitulasi = RekapitulasiKegiatan::where('kelompok_id', $peserta->kelompok_id)
            ->orderBy('uraian_kegiatan')
            ->get();

        return Inertia::render('Student/Rekapitulasi/Index', [
            'kelompok' => [
                'id' => $peserta->kelompok->id,
                'nama_kelompok' => $peserta->kelompok->nama_kelompok,
                'lokasi' => $peserta->kelompok->lokasi ? [
                    'village_name' => $peserta->kelompok->lokasi->village_name,
                    'district_name' => $peserta->kelompok->lokasi->district_name,
                    'regency_name' => $peserta->kelompok->lokasi->regency_name,
                ] : null,
                'periode' => $peserta->kelompok->periode ? [
                    'name' => $peserta->kelompok->periode->name,
                ] : null,
            ],
            'rekapitulasi' => $rekapitulasi,
            'dpl' => $peserta->kelompok->dosen ? [
                'nama' => $peserta->kelompok->dosen->nama,
            ] : null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $mahasiswa = auth()->user()->mahasiswa;
        abort_if(! $mahasiswa, 403, 'Data mahasiswa tidak ditemukan.');

        $peserta = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
            ->where('status', 'approved')
            ->first();

        abort_if(! $peserta || ! $peserta->kelompok_id, 403, 'Anda belum memiliki kelompok KKN aktif.');

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.uraian_kegiatan' => ['required', 'string', 'max:255'],
            'items.*.satuan' => ['required', 'string', 'max:50'],
            'items.*.volume' => ['required', 'integer', 'min:1'],
            'items.*.swadaya_mhs' => ['required', 'integer', 'min:0'],
            'items.*.swadaya_masyarakat' => ['required', 'integer', 'min:0'],
            'items.*.bantuan_pemerintah' => ['required', 'integer', 'min:0'],
            'items.*.donatur_lain' => ['required', 'integer', 'min:0'],
            'items.*.jumlah' => ['required', 'integer', 'min:0'],
            'items.*.keterangan' => ['nullable', 'string'],
        ]);

        // Delete existing entries for this kelompok
        RekapitulasiKegiatan::where('kelompok_id', $peserta->kelompok_id)->delete();

        // Insert new entries
        foreach ($validated['items'] as $item) {
            if (! empty($item['uraian_kegiatan'])) {
                RekapitulasiKegiatan::create([
                    'kelompok_id' => $peserta->kelompok_id,
                    'uraian_kegiatan' => $item['uraian_kegiatan'],
                    'satuan' => $item['satuan'] ?? 'kegiatan',
                    'volume' => $item['volume'] ?? 1,
                    'swadaya_mhs' => $item['swadaya_mhs'] ?? 0,
                    'swadaya_masyarakat' => $item['swadaya_masyarakat'] ?? 0,
                    'bantuan_pemerintah' => $item['bantuan_pemerintah'] ?? 0,
                    'donatur_lain' => $item['donatur_lain'] ?? 0,
                    'jumlah' => $item['jumlah'] ?? 0,
                    'keterangan' => $item['keterangan'] ?? null,
                ]);
            }
        }

        return redirect()->route('student.rekapitulasi.index')
            ->with('success', 'Rekapitulasi kegiatan berhasil disimpan.');
    }
}
