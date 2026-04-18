<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\KKN\LaporanAkhir;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FinalReportController extends Controller
{
    /**
     * Validate file magic bytes to prevent MIME spoofing.
     */
    private function validateFileMagicBytes($file, ?array $allowedSignatures = null): void
    {
        if ($allowedSignatures === null) {
            $allowedSignatures = [
                'pdf' => [0x25, 0x50, 0x44], // %PDF
                'zip_or_docx' => [0x50, 0x4B, 0x03, 0x04], // PK.. (DOCX/ZIP)
                'jpg' => [0xFF, 0xD8, 0xFF], // JPEG
                'png' => [0x89, 0x50, 0x4E, 0x47], // PNG
            ];
        }

        try {
            $stream = fopen($file->getRealPath(), 'rb');
            $bytes = array_values(unpack('C4', fread($stream, 4)));
            fclose($stream);

            $valid = false;
            foreach ($allowedSignatures as $signature) {
                if (count($bytes) >= count($signature)) {
                    if (array_slice($bytes, 0, count($signature)) === array_values($signature)) {
                        $valid = true;
                        break;
                    }
                }
            }

            abort_if(! $valid, 422, 'Format file '.$file->getClientOriginalName().' tidak valid atau terdeteksi manipulasi ekstensi.');
        } catch (\Exception $e) {
            abort(422, 'Gagal memvalidasi integritas file.');
        }
    }

    public function create(): Response
    {
        $mahasiswa = auth()->user()?->mahasiswa;
        $pendaftaran = $mahasiswa?->peserta()->where('status', 'approved')->first();

        $laporanAda = $pendaftaran
            ? LaporanAkhir::where('kelompok_id', $pendaftaran->kelompok_id)->with('mahasiswa')->latest()->first()
            : null;

        return Inertia::render('Student/FinalReport/Create', [
            'group' => $pendaftaran?->kelompok,
            'existingReport' => $laporanAda,
            'uploadedBy' => $laporanAda?->mahasiswa?->nama,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $mahasiswa = auth()->user()?->mahasiswa;
        abort_if(! $mahasiswa, 403, 'Profil mahasiswa tidak ditemukan.');

        $pendaftaran = $mahasiswa->peserta()->where('status', 'approved')->first();

        abort_if(! $pendaftaran || ! $pendaftaran->kelompok_id, 403, 'Anda belum terdaftar dalam kelompok.');

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:300'],
            'abstract' => ['nullable', 'string'],
            'video_link' => ['nullable', 'url', 'max:255'],
            'news_link' => ['nullable', 'url', 'max:255'],
            'file' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:20480'],
            'article_1' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:10240'],
            'article_2' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:10240'],
            'poster_1' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'poster_2' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'poster_3' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        return \DB::transaction(function () use ($request, $validated, $pendaftaran, $mahasiswa) {
            // Re-check existence within transaction to prevent race conditions
            $existing = LaporanAkhir::where('kelompok_id', $pendaftaran->kelompok_id)->lockForUpdate()->exists();
            if ($existing) {
                return redirect()->back()->with('error', 'Laporan akhir untuk kelompok Anda sudah diunggah oleh anggota lain.');
            }

            $file = $request->file('file');
            $this->validateFileMagicBytes($file);
            $path = $file->storeAs('final-reports', Str::uuid().'.'.$file->getClientOriginalExtension(), 'local');

            $article1Path = null;
            if ($request->hasFile('article_1')) {
                $this->validateFileMagicBytes($request->file('article_1'));
                $article1Path = $request->file('article_1')->storeAs('final-reports/articles', Str::uuid().'.'.$request->file('article_1')->getClientOriginalExtension(), 'local');
            }

            $article2Path = null;
            if ($request->hasFile('article_2')) {
                $this->validateFileMagicBytes($request->file('article_2'));
                $article2Path = $request->file('article_2')->storeAs('final-reports/articles', Str::uuid().'.'.$request->file('article_2')->getClientOriginalExtension(), 'local');
            }

            $posterPaths = [];
            foreach (['poster_1', 'poster_2', 'poster_3'] as $key) {
                if ($request->hasFile($key)) {
                    $this->validateFileMagicBytes($request->file($key), [
                        'pdf' => [0x25, 0x50, 0x44],
                        'jpg' => [0xFF, 0xD8, 0xFF],
                        'png' => [0x89, 0x50, 0x4E, 0x47],
                    ]);
                    $posterPaths[$key] = $request->file($key)->storeAs('final-reports/posters', Str::uuid().'.'.$request->file($key)->getClientOriginalExtension(), 'local');
                }
            }

            LaporanAkhir::create([
                'kelompok_id' => $pendaftaran->kelompok_id,
                'mahasiswa_id' => $mahasiswa->id,
                'title' => $validated['title'],
                'abstract' => $validated['abstract'] ?? null,
                'video_link' => $validated['video_link'] ?? null,
                'news_link' => $validated['news_link'] ?? null,
                'file_path' => $path,
                'file_name' => Str::limit($file->getClientOriginalName(), 255),
                'article_1_path' => $article1Path,
                'article_2_path' => $article2Path,
                'poster_1_path' => $posterPaths['poster_1'] ?? null,
                'poster_2_path' => $posterPaths['poster_2'] ?? null,
                'poster_3_path' => $posterPaths['poster_3'] ?? null,
                'status' => 'submitted',
                'submitted_at' => now(),
            ]);

            return redirect()->route('student.dashboard')
                ->with('success', 'Laporan akhir kelompok berhasil dikirim.');
        });
    }
}
