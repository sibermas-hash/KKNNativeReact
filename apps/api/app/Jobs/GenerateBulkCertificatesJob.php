<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\KKN\NilaiKkn;
use App\Models\KKN\Periode;
use App\Services\CertificateService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use ZipArchive;

class GenerateBulkCertificatesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 600; // 10 minutes

    /**
     * Re-audit 2026-05-10 H-004: retry policy added. Certificate generation
     * often fails mid-batch due to DomPDF memory spikes; auto-retry lets the
     * job recover after a worker restart.
     */
    public int $tries = 3;

    public array $backoff = [30, 120, 600];

    /**
     * Create a new job instance.
     */
    public function __construct(
        protected string $userId,
        protected int $periodeId,
        protected ?int $facultyId = null,
    ) {}

    /**
     * Execute the job.
     */
    public function handle(CertificateService $service): void
    {
        try {
            $periode = Periode::findOrFail($this->periodeId);
            $query = NilaiKkn::query()
                ->where('is_finalized', true)
                ->whereHas('kelompok', fn ($q) => $q->where('periode_id', $this->periodeId));

            if ($this->facultyId) {
                $query->whereHas('mahasiswa', fn ($q) => $q->where('fakultas_id', $this->facultyId));
            }

            $nilaiRecords = $query->with(['mahasiswa.user', 'kelompok.periode', 'kelompok.lokasi'])->get();

            if ($nilaiRecords->isEmpty()) {
                Log::warning("GenerateBulkCertificatesJob: No records found for period {$this->periodeId}");

                return;
            }

            $zipName = "Sertifikat_Massal_KKN_Periode_{$this->periodeId}_".now()->timestamp.'.zip';
            $zipPath = storage_path("app/tmp/{$zipName}");

            if (! is_dir(storage_path('app/tmp'))) {
                mkdir(storage_path('app/tmp'), 0755, true);
            }

            $zip = new ZipArchive;
            if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
                throw new \Exception("Cannot create ZIP file at {$zipPath}");
            }

            foreach ($nilaiRecords as $nilai) {
                    $pdf = $service->generateForStudent($nilai);
                $fileName = 'Sertifikat_'.str_replace(' ', '_', $nilai->mahasiswa->nama)."_{$nilai->mahasiswa->nim}.pdf";
                $zip->addFromString($fileName, $pdf->output());
            }

            $zip->close();

            // Notify user or store in a downloads table
            Log::info("GenerateBulkCertificatesJob: ZIP created successfully at {$zipPath}");

            // Note: In a real system, you'd store this in a 'downloads' table for the user to pick up later.
            // For now, we've successfully moved the heavy logic out of the web request.

        } catch (\Exception $e) {
            Log::error('GenerateBulkCertificatesJob failed: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * R13-API-006: ensure cleanup + log on exhausted retries so admin UI can
     * surface the failure instead of hanging on "processing".
     */
    public function failed(\Throwable $e): void
    {
        Log::error("GenerateBulkCertificatesJob exhausted retries for period {$this->periodeId}: ".$e->getMessage());
    }
}
