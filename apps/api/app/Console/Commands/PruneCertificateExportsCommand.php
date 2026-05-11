<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * R-005 fix (audit).
 *
 * Deletes mass-certificate ZIPs written by GenerateMassCertificatesJob after
 * their signed-URL lifetime (+ buffer) has expired. Without this the private
 * disk fills up — each period-wide export is ~300MB of PDFs.
 *
 * Scheduled hourly from bootstrap/app.php. Signed URLs are valid for 2h,
 * cache token→path mapping is kept for 3h, so a 6h retention is safely
 * past both. Adjust with --hours if you need to keep them longer.
 */
class PruneCertificateExportsCommand extends Command
{
    protected $signature = 'certificates:prune-exports {--hours=6 : Delete files older than this many hours}';

    protected $description = 'Delete expired mass-certificate ZIP exports from the private disk';

    public function handle(): int
    {
        $hours = max(1, (int) $this->option('hours'));
        $cutoff = now()->subHours($hours)->timestamp;

        $disk = Storage::disk('local');
        $directory = 'exports/certificates';

        if (! $disk->exists($directory)) {
            $this->info("Nothing to prune (directory {$directory} doesn't exist).");
            return self::SUCCESS;
        }

        $files = $disk->files($directory);
        $deleted = 0;

        foreach ($files as $file) {
            try {
                if ($disk->lastModified($file) < $cutoff) {
                    $disk->delete($file);
                    $deleted++;
                }
            } catch (\Throwable $e) {
                $this->warn("Could not process {$file}: ".$e->getMessage());
            }
        }

        $this->info("Pruned {$deleted} export(s) older than {$hours}h.");
        return self::SUCCESS;
    }
}
