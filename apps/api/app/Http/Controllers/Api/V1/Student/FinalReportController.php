<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\LaporanAkhirResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\LaporanAkhir;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FinalReportController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $mahasiswa = auth()->user()?->mahasiswa;
        $registration = $mahasiswa?->peserta()->where('status', 'approved')->first();

        if (! $registration?->kelompok_id) {
            return $this->success(['report' => null, 'is_leader' => false]);
        }

        $report = LaporanAkhir::where('kelompok_id', $registration->kelompok_id)
            ->latest('submitted_at')->latest('id')->first();

        return $this->success([
            'report' => $report ? new LaporanAkhirResource($report) : null,
            // UX hint: FE hides submit form for non-leaders (audit F-02).
            // Backend still enforces the check below — this is display-only.
            'is_leader' => strtolower((string) $registration->role) === 'ketua',
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $mahasiswa = auth()->user()?->mahasiswa;
        $registration = $mahasiswa?->peserta()->where('status', 'approved')->first();

        if (! $registration?->kelompok_id) {
            return $this->forbidden('Anda belum ditempatkan di kelompok.');
        }

        // Audit F-02 fix: laporan akhir adalah output kolektif kelompok.
        // Sebelumnya anggota manapun bisa overwrite submission anggota lain
        // karena query hanya by kelompok_id. Sekarang restrict ke ketua
        // kelompok (peserta_kkn.role = 'Ketua') — pola yang sama dengan
        // PoskoController::store. Anggota non-ketua harus meminta ketua
        // mengunggah via satu pintu.
        if (strtolower((string) $registration->role) !== 'ketua') {
            return $this->forbidden('Hanya ketua kelompok yang dapat mengunggah laporan akhir. Silakan koordinasikan dengan ketua kelompok Anda.');
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

        return DB::transaction(function () use ($request, $validated, $registration, $mahasiswa) {
            $existing = LaporanAkhir::where('kelompok_id', $registration->kelompok_id)
                ->lockForUpdate()->latest()->first();

            if ($existing && ! $existing->canBeResubmitted()) {
                return $this->error('VALIDATION_ERROR', 'Laporan akhir untuk kelompok Anda sudah diunggah dan tidak dapat diganti.', 422);
            }

            $file = $request->file('file');
            $this->validateMagicBytes($file);
            $filePath = $file->storeAs('final-reports', Str::uuid().'.'.$file->getClientOriginalExtension(), config('filesystems.default'));

            $article1Path = $existing?->article_1_path;
            if ($request->hasFile('article_1')) {
                $f = $request->file('article_1');
                $this->validateMagicBytes($f);
                $article1Path = $f->storeAs('final-reports/articles', Str::uuid().'.'.$f->getClientOriginalExtension(), config('filesystems.default'));
            }

            $article2Path = $existing?->article_2_path;
            if ($request->hasFile('article_2')) {
                $f = $request->file('article_2');
                $this->validateMagicBytes($f);
                $article2Path = $f->storeAs('final-reports/articles', Str::uuid().'.'.$f->getClientOriginalExtension(), config('filesystems.default'));
            }

            $posterSigs = ['pdf' => [0x25, 0x50, 0x44], 'jpg' => [0xFF, 0xD8, 0xFF], 'png' => [0x89, 0x50, 0x4E, 0x47]];
            $posterPaths = [
                'poster_1' => $existing?->poster_1_path,
                'poster_2' => $existing?->poster_2_path,
                'poster_3' => $existing?->poster_3_path,
            ];
            foreach (array_keys($posterPaths) as $key) {
                if ($request->hasFile($key)) {
                    $f = $request->file($key);
                    $this->validateMagicBytes($f, $posterSigs);
                    $posterPaths[$key] = $f->storeAs('final-reports/posters', Str::uuid().'.'.$f->getClientOriginalExtension(), config('filesystems.default'));
                }
            }

            $payload = [
                'mahasiswa_id' => $mahasiswa->id,
                'title' => $validated['title'],
                'abstract' => $validated['abstract'] ?? null,
                'video_link' => $validated['video_link'] ?? null,
                'news_link' => $validated['news_link'] ?? null,
                'file_path' => $filePath,
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
            ];

            if ($existing) {
                $existing->update($payload);
                $report = $existing->refresh();
                $message = 'Revisi laporan akhir berhasil dikirim ulang.';
            } else {
                $report = LaporanAkhir::create(array_merge($payload, ['kelompok_id' => $registration->kelompok_id]));
                $message = 'Laporan akhir berhasil dikirim.';
            }

            return $this->created(new LaporanAkhirResource($report), $message);
        });
    }

    public function preview(LaporanAkhir $laporanAkhir): StreamedResponse
    {
        $user = auth()->user();
        $mahasiswa = $user->mahasiswa;

        abort_if(
            ! $user->hasAnyRole(['admin', 'superadmin', 'dpl']) &&
            (! $mahasiswa || $mahasiswa->peserta()->where('kelompok_id', $laporanAkhir->kelompok_id)->doesntExist()),
            403
        );

        $disk = config('filesystems.default');
        abort_if(! Storage::disk($disk)->exists($laporanAkhir->file_path), 404);

        return Storage::disk($disk)->response($laporanAkhir->file_path);
    }

    private function validateMagicBytes($file, ?array $signatures = null): void
    {
        $signatures ??= [
            'pdf' => [0x25, 0x50, 0x44],
            'zip_or_docx' => [0x50, 0x4B, 0x03, 0x04],
            'jpg' => [0xFF, 0xD8, 0xFF],
            'png' => [0x89, 0x50, 0x4E, 0x47],
        ];

        $stream = fopen($file->getRealPath(), 'rb');
        $bytes = array_values(unpack('C4', fread($stream, 4)));
        fclose($stream);

        foreach ($signatures as $sig) {
            if (array_slice($bytes, 0, count($sig)) === array_values($sig)) {
                return;
            }
        }

        abort(422, 'Format file '.$file->getClientOriginalName().' tidak valid.');
    }
}
