<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\KKN\LaporanAkhir;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Attribute\Get;
use Illuminate\Routing\Attribute\Post;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

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

    private function storeValidatedUpload($file, string $directory, ?array $allowedSignatures = null): string
    {
        $this->validateFileMagicBytes($file, $allowedSignatures);

        return $file->storeAs($directory, Str::uuid().'.'.$file->getClientOriginalExtension(), 'local');
    }

    private function deleteLocalAsset(?string $path): void
    {
        if ($path && Storage::disk('local')->exists($path)) {
            Storage::disk('local')->delete($path);
        }
    }

    #[Get('/mahasiswa/laporan-akhir', name: 'student.laporan-akhir.index')]
    #[Get('/mahasiswa/laporan-akhir/buat', name: 'student.laporan-akhir.create')]
    public function create(): Response
    {
        $mahasiswa = auth()->user()?->mahasiswa;
        $pendaftaran = $mahasiswa?->peserta()->where('status', 'approved')->first();

        $laporanAda = $pendaftaran
            ? LaporanAkhir::where('kelompok_id', $pendaftaran->kelompok_id)->with('mahasiswa')->latest()->first()
            : null;

        return Inertia::render('Student/FinalReport/Create', [
            'group' => $pendaftaran?->kelompok,
            'existingReport' => $laporanAda ? [
                'id' => $laporanAda->id,
                'title' => $laporanAda->title,
                'abstract' => $laporanAda->abstract,
                'video_link' => $laporanAda->video_link,
                'news_link' => $laporanAda->news_link,
                'status' => $laporanAda->canonicalStatus(),
                'file_name' => $laporanAda->file_name,
                'review_notes' => $laporanAda->review_notes,
                'submitted_at' => optional($laporanAda->submitted_at)->toIso8601String(),
            ] : null,
            'uploadedBy' => $laporanAda?->mahasiswa?->nama,
        ]);
    }

    #[Post('/mahasiswa/laporan-akhir', name: 'student.laporan-akhir.store')]
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
            $existing = LaporanAkhir::where('kelompok_id', $pendaftaran->kelompok_id)
                ->lockForUpdate()
                ->latest()
                ->first();

            if ($existing && ! $existing->canBeResubmitted()) {
                return redirect()->back()->with('error', 'Laporan akhir untuk kelompok Anda sudah diunggah oleh anggota lain.');
            }

            $file = $request->file('file');
            $path = $this->storeValidatedUpload($file, 'final-reports');

            $article1Path = $existing?->article_1_path;
            if ($request->hasFile('article_1')) {
                $article1Path = $this->storeValidatedUpload(
                    $request->file('article_1'),
                    'final-reports/articles'
                );
            }

            $article2Path = $existing?->article_2_path;
            if ($request->hasFile('article_2')) {
                $article2Path = $this->storeValidatedUpload(
                    $request->file('article_2'),
                    'final-reports/articles'
                );
            }

            $posterSignatures = [
                'pdf' => [0x25, 0x50, 0x44],
                'jpg' => [0xFF, 0xD8, 0xFF],
                'png' => [0x89, 0x50, 0x4E, 0x47],
            ];

            $posterPaths = [
                'poster_1' => $existing?->poster_1_path,
                'poster_2' => $existing?->poster_2_path,
                'poster_3' => $existing?->poster_3_path,
            ];

            foreach (array_keys($posterPaths) as $key) {
                if ($request->hasFile($key)) {
                    $posterPaths[$key] = $this->storeValidatedUpload(
                        $request->file($key),
                        'final-reports/posters',
                        $posterSignatures
                    );
                }
            }

            if ($existing) {
                $obsoletePaths = array_filter([
                    $existing->file_path,
                    $article1Path !== $existing->article_1_path ? $existing->article_1_path : null,
                    $article2Path !== $existing->article_2_path ? $existing->article_2_path : null,
                    $posterPaths['poster_1'] !== $existing->poster_1_path ? $existing->poster_1_path : null,
                    $posterPaths['poster_2'] !== $existing->poster_2_path ? $existing->poster_2_path : null,
                    $posterPaths['poster_3'] !== $existing->poster_3_path ? $existing->poster_3_path : null,
                ]);

                $existing->update([
                    'mahasiswa_id' => $mahasiswa->id,
                    'title' => $validated['title'],
                    'abstract' => $validated['abstract'] ?? null,
                    'video_link' => $validated['video_link'] ?? null,
                    'news_link' => $validated['news_link'] ?? null,
                    'file_path' => $path,
                    'file_name' => Str::limit($file->getClientOriginalName(), 255),
                    'article_1_path' => $article1Path,
                    'article_2_path' => $article2Path,
                    'poster_1_path' => $posterPaths['poster_1'],
                    'poster_2_path' => $posterPaths['poster_2'],
                    'poster_3_path' => $posterPaths['poster_3'],
                    'status' => LaporanAkhir::STATUS_SUBMITTED,
                    'submitted_at' => now(),
                    'review_notes' => null,
                    'reviewed_by' => null,
                    'reviewed_at' => null,
                ]);

                foreach ($obsoletePaths as $obsoletePath) {
                    $this->deleteLocalAsset($obsoletePath);
                }

                return redirect()->route('student.dashboard')
                    ->with('success', 'Revisi laporan akhir kelompok berhasil dikirim ulang.');
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
                'poster_1_path' => $posterPaths['poster_1'],
                'poster_2_path' => $posterPaths['poster_2'],
                'poster_3_path' => $posterPaths['poster_3'],
                'status' => LaporanAkhir::STATUS_SUBMITTED,
                'submitted_at' => now(),
            ]);

            return redirect()->route('student.dashboard')
                ->with('success', 'Laporan akhir kelompok berhasil dikirim.');
        });
    }

    /**
     * Preview report file for the new Document Viewer.
     */
    #[Get('/mahasiswa/laporan-akhir/{laporanAkhir}/preview', name: 'student.laporan-akhir.preview')]
    public function preview(LaporanAkhir $laporanAkhir): StreamedResponse
    {
        // Security check: Only members of the same group or authorized staff
        $user = auth()->user();
        $mahasiswa = $user->mahasiswa;

        abort_if(
            ! $user->hasAnyRole(['admin', 'superadmin', 'dpl']) &&
            (! $mahasiswa || $mahasiswa->peserta()->where('kelompok_id', $laporanAkhir->kelompok_id)->doesntExist()),
            403
        );

        abort_if(! Storage::disk('local')->exists($laporanAkhir->file_path), 404);

        return Storage::disk('local')->response($laporanAkhir->file_path);
    }
}
