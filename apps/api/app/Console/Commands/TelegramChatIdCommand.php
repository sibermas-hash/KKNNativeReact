<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

/**
 * monitoring:telegram-chat-id — helper untuk dapatkan chat_id.
 *
 * Cara pakai:
 *   1. Buka @Sibermas_bot di Telegram → klik Start / kirim pesan apapun
 *      (untuk group: tambahkan bot ke group, lalu kirim `/start@Sibermas_bot`)
 *   2. Jalankan: php artisan monitoring:telegram-chat-id
 *   3. Copy chat_id yang muncul → paste ke TELEGRAM_CHAT_ID di .env
 *   4. Verify dengan: php artisan monitoring:health-check --heartbeat
 */
class TelegramChatIdCommand extends Command
{
    protected $signature = 'monitoring:telegram-chat-id';

    protected $description = 'Query getUpdates untuk bantu dapatkan TELEGRAM_CHAT_ID';

    public function handle(): int
    {
        $token = (string) config('services.telegram.bot_token', '');

        if ($token === '') {
            $this->error('TELEGRAM_BOT_TOKEN belum di-set di .env');

            return self::FAILURE;
        }

        $this->info("Querying updates untuk bot...");

        $response = Http::timeout(10)->get("https://api.telegram.org/bot{$token}/getUpdates");

        if (! $response->successful()) {
            $this->error("Telegram API error: HTTP {$response->status()}");
            $this->line(mb_substr($response->body(), 0, 500));

            return self::FAILURE;
        }

        $data = $response->json();
        $updates = $data['result'] ?? [];

        if (empty($updates)) {
            $this->warn('Belum ada message yang masuk ke bot.');
            $this->line('');
            $this->line('Langkah:');
            $this->line('  1. Buka bot di Telegram, klik Start / kirim pesan apapun');
            $this->line('     (Private: @Sibermas_bot  |  Group: add bot, kirim /start@Sibermas_bot)');
            $this->line('  2. Jalankan command ini lagi');

            return self::FAILURE;
        }

        $chats = [];
        foreach ($updates as $update) {
            $msg = $update['message'] ?? $update['channel_post'] ?? $update['my_chat_member'] ?? null;
            if (! $msg) {
                continue;
            }

            $chat = $msg['chat'] ?? null;
            if (! $chat) {
                continue;
            }

            $id = (int) $chat['id'];
            if (isset($chats[$id])) {
                continue;
            }

            $chats[$id] = [
                'id' => $id,
                'type' => $chat['type'] ?? 'unknown',
                'title' => $chat['title'] ?? ($chat['first_name'] ?? '') . ' ' . ($chat['last_name'] ?? ''),
                'username' => $chat['username'] ?? null,
            ];
        }

        if (empty($chats)) {
            $this->warn('Tidak ada chat yang valid di updates.');

            return self::FAILURE;
        }

        $this->info('Chat(s) yang terdeteksi:');
        $this->line('');

        foreach ($chats as $c) {
            $this->line(str_repeat('─', 60));
            $this->line(sprintf('  chat_id : <fg=green;options=bold>%d</>', $c['id']));
            $this->line(sprintf('  type    : %s', $c['type']));
            $this->line(sprintf('  title   : %s', trim($c['title']) ?: '-'));
            if ($c['username']) {
                $this->line(sprintf('  username: @%s', $c['username']));
            }
        }
        $this->line(str_repeat('─', 60));
        $this->line('');
        $this->info('Copy chat_id di atas → paste ke TELEGRAM_CHAT_ID di .env');
        $this->line('(group chat biasanya negatif, misal: -100123456789)');

        return self::SUCCESS;
    }
}
