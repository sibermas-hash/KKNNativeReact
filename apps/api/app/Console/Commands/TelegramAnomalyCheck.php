<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\AI\TelegramAiService;
use Illuminate\Console\Command;

/**
 * telegram:anomaly-check — AI-powered anomaly detection with Telegram alert.
 *
 * Scheduled every 30 minutes. Detects unusual patterns and sends AI-analyzed alerts.
 */
class TelegramAnomalyCheck extends Command
{
    protected $signature = 'telegram:anomaly-check';
    protected $description = 'Deteksi anomali KKN dengan AI dan kirim alert ke Telegram';

    public function handle(TelegramAiService $service): int
    {
        $sent = $service->detectAndAlertAnomalies();

        if ($sent) {
            $this->info('Anomaly alert sent to Telegram.');
        } else {
            $this->info('No anomalies detected or Telegram not configured.');
        }

        return self::SUCCESS;
    }
}
