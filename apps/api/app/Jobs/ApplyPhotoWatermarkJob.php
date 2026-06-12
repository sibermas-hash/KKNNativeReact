<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Services\PhotoWatermarkService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\Log;

/**
 * ApplyPhotoWatermarkJob — async watermark application.
 *
 * Sebelumnya `PhotoWatermarkService::apply()` dipanggil synchronous di
 * `DailyReportController::handleFileUploads` untuk setiap foto. Untuk foto
 * berukuran besar atau batch upload, ini memblokir HTTP response beberapa
 * detik (R11-FULL-017 audit finding: timeout risk).
 *
 * Sekarang: file disimpan dulu ke storage, record FileKegiatanKkn dibuat,
 * lalu job di-dispatch untuk apply watermark secara background. Foto yang
 * dilihat mahasiswa masih foto asli sampai job selesai — ini acceptable
 * karena mahasiswa sendiri yang baru upload. DPL akan selalu lihat versi
 * watermarked (job selesai dalam hitungan detik di queue normal).
 *
 * Kalau queue tidak jalan (misal dev env `QUEUE_CONNECTION=sync`), efeknya
 * sama dengan pattern lama (sync). Safe default.
 */
class ApplyPhotoWatermarkJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $maxExceptions = 2;

    public int $backoff = 30;

    /**
     * @param  string  $path  path ke file foto di storage (relative ke disk default)
     * @param  array{nim: string, captured_at: string, latitude: float|string, longitude: float|string}  $metadata
     */
    public function __construct(
        public string $path,
        public array $metadata,
    ) {}

    public function handle(PhotoWatermarkService $watermarkService): void
    {
        Context::add('watermark_path', $this->path);

        try {
            $ok = $watermarkService->apply($this->path, $this->metadata);

            if (! $ok) {
                // Service return false kalau file missing / error — sudah di-log
                // internal. Tidak kita re-throw supaya tidak masuk failed_jobs
                // untuk kasus benign.
                Log::warning('Photo watermark returned false', ['path' => $this->path]);
            }
        } catch (\Throwable $e) {
            Log::error('Photo watermark job failed', [
                'path' => $this->path,
                'error' => $e->getMessage(),
            ]);
            throw $e; // let queue handle retry/failed_jobs
        }
    }

    /**
     * R13-API-006: final failure hook — logs after retries are exhausted so
     * we can surface the originating path to ops alerts.
     */
    public function failed(\Throwable $e): void
    {
        Log::error('ApplyPhotoWatermarkJob exhausted retries', [
            'path' => $this->path,
            'error' => $e->getMessage(),
        ]);
    }
}
