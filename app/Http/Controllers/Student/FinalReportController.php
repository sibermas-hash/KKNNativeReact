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
                'pdf' => [0x25, 0x50, 0x44], // %PD
                'docx' => [0x50, 0x4B, 0x03, 0x04], // PK (ZIP)
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

            abort_if(! $valid, 422, 'File format tidak valid atau tidak sesuai dengan type yang dideklarasikan.');
        } catch (\Exception $e) {
            abort(422, 'Gagal memvalidasi file.');
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

        // Check if report already exists for this group (safety net)
        $existing = LaporanAkhir::where('kelompok_id', $pendaftaran->kelompok_id)->exists();
        if ($existing) {
            return redirect()->back()->with('error', 'Laporan akhir untuk kelompok Anda sudah diunggah oleh anggota lain.');
        }

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

        $file = $request->file('file');
        $this->validateFileMagicBytes($file);
        $path = $file->storeAs('final-reports', Str::uuid().'.'.$file->getClientOriginalExtension(), 'local');

        $article1Path = null;
        if ($request->hasFile('article_1')) {
            $this->validateFileMagicBytes($request->file('article_1'));
            $article1Path = $request->file('article_1')->storeAs('final-reports', Str::uuid().'.'.$request->file('article_1')->getClientOriginalExtension(), 'local');
        }

        $article2Path = null;
        if ($request->hasFile('article_2')) {
            $this->validateFileMagicBytes($request->file('article_2'));
            $article2Path = $request->file('article_2')->storeAs('final-reports', Str::uuid().'.'.$request->file('article_2')->getClientOriginalExtension(), 'local');
        }

        $poster1Path = null;
        if ($request->hasFile('poster_1')) {
            $poster1Path = $request->file('poster_1')->storeAs('final-reports/posters', Str::uuid().'.'.$request->file('poster_1')->getClientOriginalExtension(), 'local');
        }

        $poster2Path = null;
        if ($request->hasFile('poster_2')) {
            $poster2Path = $request->file('poster_2')->storeAs('final-reports/posters', Str::uuid().'.'.$request->file('poster_2')->getClientOriginalExtension(), 'local');
        }

        $poster3Path = null;
        if ($request->hasFile('poster_3')) {
            $poster3Path = $request->file('poster_3')->storeAs('final-reports/posters', Str::uuid().'.'.$request->file('poster_3')->getClientOriginalExtension(), 'local');
        }

        LaporanAkhir::updateOrCreate(
            ['kelompok_id' => $pendaftaran->kelompok_id],
            [
                'mahasiswa_id' => $mahasiswa->id,
                'title' => $validated['title'],
                'abstract' => $validated['abstract'] ?? null,
                'video_link' => $validated['video_link'] ?? null,
                'news_link' => $validated['news_link'] ?? null,
                'file_path' => $path,
                'file_name' => Str::limit($file->getClientOriginalName(), 255),
                'article_1_path' => $article1Path,
                'article_2_path' => $article2Path,
                'poster_1_path' => $poster1Path,
                'poster_2_path' => $poster2Path,
                'poster_3_path' => $poster3Path,
                'status' => 'submitted',
                'submitted_at' => now(),
            ],
        );

        return redirect()->route('student.dashboard')
            ->with('success', 'Laporan akhir kelompok berhasil dikirim.');
    }
}
