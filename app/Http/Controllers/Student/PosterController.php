<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\PesertaKkn;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PosterController extends Controller
{
    public function index(): Response
    {
        $mahasiswa = auth()->user()->mahasiswa;
        abort_if(!$mahasiswa, 403, 'Data mahasiswa tidak ditemukan.');

        $peserta = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
            ->where('status', 'approved')
            ->with('kelompok')
            ->first();

        abort_if(!$peserta || !$peserta->kelompok, 403, 'Anda belum memiliki kelompok KKN aktif.');

        $kelompok = $peserta->kelompok;

        return Inertia::render('Student/Poster/Index', [
            'kelompok' => [
                'id' => $kelompok->id,
                'nama_kelompok' => $kelompok->nama_kelompok,
                'poster_potensi_desa_path' => $kelompok->poster_potensi_desa_path,
                'poster_potensi_desa_name' => $kelompok->poster_potensi_desa_name,
            ],
            'allowedTypes' => ['pdf', 'jpg', 'jpeg', 'png'],
            'maxSize' => '5 MB',
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $mahasiswa = auth()->user()->mahasiswa;
        abort_if(!$mahasiswa, 403, 'Data mahasiswa tidak ditemukan.');

        $peserta = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
            ->where('status', 'approved')
            ->first();

        abort_if(!$peserta || !$peserta->kelompok_id, 403, 'Anda belum memiliki kelompok KKN aktif.');

        $validated = $request->validate([
            'poster' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        $kelompok = KelompokKkn::findOrFail($peserta->kelompok_id);

        // Delete old poster if exists
        if ($kelompok->poster_potensi_desa_path) {
            Storage::disk('public')->delete($kelompok->poster_potensi_desa_path);
        }

        $path = $request->file('poster')->store('posters-potensi-desa', 'public');

        $kelompok->update([
            'poster_potensi_desa_path' => $path,
            'poster_potensi_desa_name' => $request->file('poster')->getClientOriginalName(),
            'poster_potensi_desa_type' => $request->file('poster')->getClientMimeType(),
        ]);

        return redirect()->route('student.poster.index')
            ->with('success', 'Poster Peta Potensi Desa berhasil diunggah.');
    }
}
