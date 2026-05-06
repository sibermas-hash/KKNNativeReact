<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\PesertaKkn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PosterController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $mahasiswa = auth()->user()->mahasiswa;
        abort_if(! $mahasiswa, 403, 'Data mahasiswa tidak ditemukan.');

        $peserta = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
            ->where('status', 'approved')
            ->with('kelompok')
            ->first();

        abort_if(! $peserta?->kelompok, 403, 'Anda belum memiliki kelompok KKN aktif.');

        $kelompok = $peserta->kelompok;

        return $this->success([
            'kelompok' => [
                'id' => $kelompok->id,
                'nama_kelompok' => $kelompok->nama_kelompok,
                'poster_potensi_desa_path' => $kelompok->poster_potensi_desa_path,
                'poster_potensi_desa_name' => $kelompok->poster_potensi_desa_name,
                'poster_url' => $kelompok->poster_potensi_desa_path
                    ? Storage::url($kelompok->poster_potensi_desa_path)
                    : null,
            ],
            'allowed_types' => ['pdf', 'jpg', 'jpeg', 'png'],
            'max_size_mb' => 5,
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

        $request->validate([
            'poster' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        $kelompok = KelompokKkn::findOrFail($peserta->kelompok_id);

        // Delete old poster if exists
        if ($kelompok->poster_potensi_desa_path) {
            Storage::delete($kelompok->poster_potensi_desa_path);
        }

        $file = $request->file('poster');
        $path = $file->store("posters/kelompok/{$kelompok->id}", 'public');

        $kelompok->update([
            'poster_potensi_desa_path' => $path,
            'poster_potensi_desa_name' => $file->getClientOriginalName(),
        ]);

        return $this->success([
            'poster_url' => Storage::url($path),
            'poster_name' => $file->getClientOriginalName(),
        ], 'Poster potensi desa berhasil diunggah.');
    }
}
