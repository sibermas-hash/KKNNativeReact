<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\KKN\NilaiKkn;
use App\Models\User;
use App\Notifications\KknActivityNotification;
use App\Services\CertificateService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

class GenerateMassCertificatesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 900; // 15 minutes

    public function __construct(
        private int $periodId,
        private array $filters,
        private int $adminId
    ) {}

    public function handle(CertificateService $certificateService): void
    {
        $cacheKey = "cert_progress_{$this->periodId}_{$this->adminId}";
        Log::info("Starting background certificate generation for Period ID: {$this->periodId}");

        $query = NilaiKkn::whereHas('kelompok', function ($q) {
            $q->where('periode_id', $this->periodId);
        })->where('is_finalized', true);

        if (! empty($this->filters['fakultas_id'])) {
            $query->whereHas('mahasiswa', fn ($q) => $q->where('fakultas_id', $this->filters['fakultas_id']));
        }

        if (! empty($this->filters['kelompok_id'])) {
            $query->where('kelompok_id', $this->filters['kelompok_id']);
        }

        $scores = $query->with([
            'mahasiswa.user',
            'kelompok.periode',
            'kelompok.lokasi',
            'kelompok.dpl.user',
        ])->get();

        $total = $scores->count();
        if ($total === 0) {
            Cache::put($cacheKey, ['status' => 'failed', 'message' => 'Tidak ada sertifikat untuk diproses.'], 3600);

            return;
        }

        $zip = new ZipArchive;
        $zipName = "Sertifikat_KKN_Periode_{$this->periodId}_".now()->format('Ymd_His').'.zip';
        $zipRelativePath = "exports/{$zipName}";
        $zipFullPath = storage_path("app/public/{$zipRelativePath}");

        if ($zip->open($zipFullPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            Cache::put($cacheKey, ['status' => 'failed', 'message' => 'Gagal membuat arsip ZIP.'], 3600);

            return;
        }

        $processed = 0;
        foreach ($scores as $score) {
            try {
                $pdf = $certificateService->generateForStudent($score);
                $nim = $score->mahasiswa->nim ?? 'Unknown';
                $name = $score->mahasiswa->nama ?? 'Mahasiswa';
                $pdfName = "Sertifikat_{$name}_{$nim}.pdf";

                // Sanitize filename
                $pdfName = preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $pdfName);

                $zip->addFromString($pdfName, $pdf->output());
            } catch (\Exception $e) {
                Log::error("Failed to generate PDF in background for User ID {$score->user_id}: ".$e->getMessage());
            }

            $processed++;
            if ($processed % 10 === 0) {
                Cache::put($cacheKey, [
                    'status' => 'processing',
                    'processed' => $processed,
                    'total' => $total,
                    'progress' => round(($processed / $total) * 100),
                ], 3600);
            }
        }

        $zip->close();

        $downloadUrl = Storage::disk('public')->url($zipRelativePath);

        Cache::put($cacheKey, [
            'status' => 'completed',
            'processed' => $processed,
            'total' => $total,
            'download_url' => $downloadUrl,
            'finished_at' => now(),
        ], 3600);

        // Notify Admin
        $admin = User::find($this->adminId);
        if ($admin) {
            $admin->notify(new KknActivityNotification([
                'type' => 'success',
                'title' => 'Sertifikat Massal Selesai',
                'message' => "Proses pembuatan {$total} sertifikat telah selesai. Silakan unduh file ZIP Anda.",
                'icon' => 'download',
                'url' => $downloadUrl,
            ]));
        }

        Log::info("Mass certificate generation completed: {$zipName}");
    }
}
