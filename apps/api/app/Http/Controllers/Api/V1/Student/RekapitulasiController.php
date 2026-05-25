<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\RekapitulasiKegiatan;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RekapitulasiController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        /** @var User|null $user */
        $user = auth()->user();
        $mahasiswa = $user?->mahasiswa;

        if (! $mahasiswa) {
            return $this->success([
                'kelompok' => null,
                'rekapitulasi' => [],
                'is_ketua' => false,
                'message' => 'Data mahasiswa belum tersedia.',
            ]);
        }

        $peserta = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
            ->where('status', 'approved')
            ->with(['kelompok.lokasi', 'kelompok.periode'])
            ->first();

        if (! $peserta?->kelompok) {
            return $this->success([
                'kelompok' => null,
                'rekapitulasi' => [],
                'is_ketua' => false,
                'message' => 'Anda belum memiliki kelompok KKN aktif. Rekapitulasi akan tersedia setelah plotting kelompok selesai.',
            ]);
        }

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
            'is_ketua' => strtolower((string) $peserta->role) === 'ketua',
            'rekapitulasi' => $rekapitulasi,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var User|null $user */
        $user = auth()->user();
        $mahasiswa = $user?->mahasiswa;
        abort_if(! $mahasiswa, 403, 'Data mahasiswa tidak ditemukan.');

        $peserta = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
            ->where('status', 'approved')
            ->first();

        abort_if(! $peserta?->kelompok_id, 403, 'Anda belum memiliki kelompok KKN aktif.');

        if (strtolower((string) $peserta->role) !== 'ketua') {
            return $this->forbidden('Hanya ketua kelompok yang dapat mengisi rekapitulasi kegiatan.');
        }

        $validated = $request->validate([
            'uraian_kegiatan' => ['required', 'string', 'max:500'],
            'volume' => ['nullable', 'integer', 'min:0'],
            'satuan' => ['nullable', 'string', 'max:50'],
            'swadaya_mhs' => ['nullable', 'integer', 'min:0'],
            'swadaya_masyarakat' => ['nullable', 'integer', 'min:0'],
            'bantuan_pemerintah' => ['nullable', 'integer', 'min:0'],
            'donatur_lain' => ['nullable', 'integer', 'min:0'],
            'jumlah' => ['nullable', 'integer', 'min:0'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $rekap = RekapitulasiKegiatan::create(
            array_merge($validated, ['kelompok_id' => $peserta->kelompok_id])
        );

        return $this->created($rekap, 'Rekapitulasi kegiatan berhasil disimpan.');
    }

    public function update(Request $request, RekapitulasiKegiatan $rekapitulasi): JsonResponse
    {
        /** @var User|null $user */
        $user = auth()->user();
        $mahasiswa = $user?->mahasiswa;
        abort_if(! $mahasiswa, 403, 'Data mahasiswa tidak ditemukan.');

        $peserta = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
            ->where('status', 'approved')
            ->first();

        abort_if(! $peserta?->kelompok_id, 403, 'Anda belum memiliki kelompok KKN aktif.');

        if (strtolower((string) $peserta->role) !== 'ketua') {
            return $this->forbidden('Hanya ketua kelompok yang dapat mengubah rekapitulasi kegiatan.');
        }

        if ($rekapitulasi->kelompok_id !== $peserta->kelompok_id) {
            return $this->forbidden('Anda tidak memiliki akses ke data ini.');
        }

        $validated = $request->validate([
            'uraian_kegiatan' => ['required', 'string', 'max:500'],
            'volume' => ['nullable', 'integer', 'min:0'],
            'satuan' => ['nullable', 'string', 'max:50'],
            'swadaya_mhs' => ['nullable', 'integer', 'min:0'],
            'swadaya_masyarakat' => ['nullable', 'integer', 'min:0'],
            'bantuan_pemerintah' => ['nullable', 'integer', 'min:0'],
            'donatur_lain' => ['nullable', 'integer', 'min:0'],
            'jumlah' => ['nullable', 'integer', 'min:0'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $rekapitulasi->update($validated);

        return $this->success($rekapitulasi->fresh(), 'Rekapitulasi kegiatan berhasil diperbarui.');
    }

    public function destroy(RekapitulasiKegiatan $rekapitulasi): JsonResponse
    {
        /** @var User|null $user */
        $user = auth()->user();
        $mahasiswa = $user?->mahasiswa;
        abort_if(! $mahasiswa, 403, 'Data mahasiswa tidak ditemukan.');

        $peserta = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
            ->where('status', 'approved')
            ->first();

        abort_if(! $peserta?->kelompok_id, 403, 'Anda belum memiliki kelompok KKN aktif.');

        if (strtolower((string) $peserta->role) !== 'ketua') {
            return $this->forbidden('Hanya ketua kelompok yang dapat menghapus rekapitulasi kegiatan.');
        }

        if ($rekapitulasi->kelompok_id !== $peserta->kelompok_id) {
            return $this->forbidden('Anda tidak memiliki akses ke data ini.');
        }

        $rekapitulasi->delete();

        return $this->noContent('Rekapitulasi kegiatan berhasil dihapus.');
    }
}
