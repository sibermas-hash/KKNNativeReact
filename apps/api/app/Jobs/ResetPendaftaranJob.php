<?php

declare(strict_types=1);

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

/**
 * Queue job untuk reset pendaftaran KKN.
 *
 * Dijalankan async supaya:
 *   - HTTP request return cepat (hindari timeout nginx/FPM)
 *   - Truncate yang bisa memakan puluhan detik tidak block web
 *   - Operator bisa keluar dari halaman tanpa interupsi
 *
 * Queue target: 'long' (sesuai supervisord worker-long), single attempt.
 * Job akan crash dan di-log kalau gagal — tidak retry (destructive op).
 */
class ResetPendaftaranJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 1;

    public int $timeout = 600; // 10 menit — truncate besar di data real

    public function __construct(
        private readonly int $userId,
        private readonly ?int $keepTokenId = null,
        private readonly bool $soft = false,
    ) {
        $this->onQueue('long');
    }

    public function handle(): void
    {
        Log::info('ResetPendaftaranJob started', [
            'user_id' => $this->userId,
            'soft' => $this->soft,
            'keep_token' => $this->keepTokenId,
        ]);

        $args = [
            '--force' => true,
            '--user' => (string) $this->userId,
        ];

        if ($this->soft) {
            $args['--soft'] = true;
        }

        if ($this->keepTokenId !== null) {
            $args['--keep-token'] = (string) $this->keepTokenId;
        }

        $exitCode = Artisan::call('pendaftaran:reset', $args);
        $output = Artisan::output();

        if ($exitCode !== 0) {
            Log::error('ResetPendaftaranJob failed', [
                'user_id' => $this->userId,
                'exit_code' => $exitCode,
                'output' => $output,
            ]);
            throw new \RuntimeException('Reset gagal (exit code '.$exitCode.'): '.$output);
        }

        Log::info('ResetPendaftaranJob completed', [
            'user_id' => $this->userId,
            'output_snippet' => substr($output, 0, 500),
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::critical('ResetPendaftaranJob terminal failure', [
            'user_id' => $this->userId,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);
    }
}
