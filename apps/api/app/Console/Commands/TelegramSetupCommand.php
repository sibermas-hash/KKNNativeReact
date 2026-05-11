<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

/**
 * monitoring:telegram-setup — wizard setup Telegram bot untuk ops alerting.
 *
 * Flow:
 *   1. Verify TELEGRAM_BOT_TOKEN valid via getMe
 *   2. Poll getUpdates sampai user DM bot-nya (max 2 menit)
 *   3. Auto-detect chat_id dari first incoming message
 *   4. Update .env dengan TELEGRAM_CHAT_ID
 *   5. Send test heartbeat untuk verifikasi pipeline live
 *
 * Usage:
 *   php artisan monitoring:telegram-setup
 *   php artisan monitoring:telegram-setup --timeout=300  # 5 menit
 */
class TelegramSetupCommand extends Command
{
    protected $signature = 'monitoring:telegram-setup
                            {--timeout=120 : Timeout in seconds waiting for first message (default 120s)}
                            {--no-write-env : Jangan tulis ke .env, cukup tampilkan chat_id}';

    protected $description = 'Auto-setup Telegram bot: detect chat_id, update .env, send test message';

    public function handle(): int
    {
        $token = (string) config('services.telegram.bot_token', '');

        if ($token === '') {
            $this->error('TELEGRAM_BOT_TOKEN belum di-set di .env');

            return self::FAILURE;
        }

        // STEP 1: verify bot token via getMe
        $this->info('[1/4] Memeriksa bot token...');
        $me = Http::timeout(10)->get("https://api.telegram.org/bot{$token}/getMe");
        if (! $me->successful() || ! ($me->json('ok') ?? false)) {
            $this->error('Bot token tidak valid. Check TELEGRAM_BOT_TOKEN di .env.');
            $this->line(mb_substr($me->body(), 0, 300));

            return self::FAILURE;
        }
        $botInfo = $me->json('result');
        $this->info(sprintf('      Bot OK: @%s (%s)', $botInfo['username'] ?? '-', $botInfo['first_name'] ?? '-'));

        // STEP 2: poll getUpdates until we get a chat
        $timeout = (int) $this->option('timeout');
        $startTime = time();
        $this->info('');
        $this->info("[2/4] Menunggu Anda DM bot... (timeout: {$timeout}s)");
        $this->line("      📱 Buka @{$botInfo['username']} di Telegram → klik Start / kirim pesan apapun");
        $this->line('');

        $chatId = null;
        $chatInfo = null;
        $pollCount = 0;
        while (time() - $startTime < $timeout) {
            $pollCount++;
            $response = Http::timeout(10)->get("https://api.telegram.org/bot{$token}/getUpdates");
            $updates = $response->json('result') ?? [];

            foreach ($updates as $update) {
                $msg = $update['message']
                    ?? $update['channel_post']
                    ?? $update['my_chat_member']
                    ?? null;

                $chat = $msg['chat'] ?? null;
                if ($chat && isset($chat['id'])) {
                    $chatId = (int) $chat['id'];
                    $chatInfo = $chat;
                    break 2;
                }
            }

            $this->output->write(sprintf("\r      Polling... (attempt #%d, elapsed %ds)", $pollCount, time() - $startTime));
            sleep(2);
        }
        $this->line('');

        if ($chatId === null) {
            $this->error('Timeout. Belum ada message yang masuk ke bot.');
            $this->line('');
            $this->line('Coba lagi:');
            $this->line('  1. Pastikan Anda sudah DM bot / bot added to group');
            $this->line('  2. Jalankan: php artisan monitoring:telegram-setup');

            return self::FAILURE;
        }

        $this->info('');
        $this->info(sprintf('      ✓ Detected: chat_id=%d, type=%s, title="%s"',
            $chatId,
            $chatInfo['type'] ?? '?',
            $chatInfo['title'] ?? ($chatInfo['first_name'] ?? '?').' '.($chatInfo['last_name'] ?? '')
        ));

        // STEP 3: update .env
        $this->info('');
        if ($this->option('no-write-env')) {
            $this->line("[3/4] SKIP (--no-write-env). chat_id: {$chatId}");
        } else {
            $this->info('[3/4] Update .env dengan TELEGRAM_CHAT_ID...');
            $envPath = base_path('.env');
            if (! file_exists($envPath)) {
                $this->error("      .env tidak ditemukan di {$envPath}");

                return self::FAILURE;
            }

            $envContent = file_get_contents($envPath);
            if (preg_match('/^TELEGRAM_CHAT_ID=.*$/m', $envContent)) {
                $envContent = preg_replace(
                    '/^TELEGRAM_CHAT_ID=.*$/m',
                    "TELEGRAM_CHAT_ID={$chatId}",
                    $envContent
                );
            } else {
                $envContent .= "\nTELEGRAM_CHAT_ID={$chatId}\n";
            }
            file_put_contents($envPath, $envContent);
            $this->info('      ✓ Updated');

            // Clear config cache (subprocess below akan reload fresh env)
            $this->call('config:clear');
        }

        // STEP 4: send test heartbeat
        $this->info('');
        $this->info('[4/4] Kirim test heartbeat...');

        if ($this->option('no-write-env')) {
            $this->warn('      SKIP (--no-write-env). Jalankan manual:');
            $this->line('      php artisan monitoring:health-check --heartbeat');

            return self::SUCCESS;
        }

        // Karena config() sudah di-cache di runtime ini (dari .env lama),
        // kita spawn subprocess untuk load .env yang baru ditulis.
        $phpBinary = PHP_BINARY;
        $artisan = base_path('artisan');
        $output = [];
        $exitCode = 0;
        exec(sprintf('%s %s monitoring:health-check --heartbeat 2>&1', escapeshellarg($phpBinary), escapeshellarg($artisan)), $output, $exitCode);

        if ($exitCode !== 0) {
            $this->error('      ✗ Test heartbeat gagal:');
            foreach ($output as $line) {
                $this->line('        '.$line);
            }

            return self::FAILURE;
        }

        $this->info('      ✓ Test heartbeat terkirim!');
        $this->line('');
        $this->info('═══════════════════════════════════════════════════════════');
        $this->info(' Telegram Alerting: SIAP PAKAI ✓');
        $this->info('═══════════════════════════════════════════════════════════');
        $this->line('');
        $this->line('Next steps:');
        $this->line('  • Cek Telegram Anda — heartbeat message sudah masuk');
        $this->line('  • Ops scheduler sudah aktif via routes/console.php:');
        $this->line('    - Health-check tiap 5 menit (alert kalau degraded)');
        $this->line('    - Daily heartbeat jam 08:00 WIB');
        $this->line('  • Manual re-test: php artisan monitoring:health-check --heartbeat');

        return self::SUCCESS;
    }
}
