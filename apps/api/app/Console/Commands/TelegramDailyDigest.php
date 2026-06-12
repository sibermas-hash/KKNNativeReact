<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\AI\TelegramAiService;
use Illuminate\Console\Command;

/**
 * telegram:daily-digest — AI-powered daily KKN operations summary via Telegram.
 *
 * Scheduled daily at 21:00 WIB. Gathers stats, runs AI analysis, sends to ops chat.
 */
class TelegramDailyDigest extends Command
{
    protected $signature = 'telegram:daily-digest';

    protected $description = 'Kirim ringkasan harian KKN dengan analisis AI ke Telegram';

    public function handle(TelegramAiService $service): int
    {
        $sent = $service->sendDailyDigest();

        if ($sent) {
            $this->info('Daily digest sent to Telegram.');

            return self::SUCCESS;
        }

        $this->warn('Daily digest not sent (Telegram not configured or AI failed).');

        return self::SUCCESS;
    }
}
