<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Telegram alert — untuk ops monitoring.
 *
 * Config di `config/services.telegram` (derived from .env):
 *   TELEGRAM_BOT_TOKEN=<from @BotFather>
 *   TELEGRAM_CHAT_ID=<group or channel ID, negative for groups>
 *
 * Test manually:
 *   php artisan tinker
 *   >>> app(\App\Services\TelegramAlertService::class)->send('Test from SIBERMAS');
 *
 * Desain: fire-and-forget — kegagalan kirim tidak throw, hanya log.
 * Alert digunakan untuk notify ops saat /health/detailed menunjukkan degraded.
 */
class TelegramAlertService
{
    public const SEVERITY_INFO = 'info';
    public const SEVERITY_WARNING = 'warning';
    public const SEVERITY_CRITICAL = 'critical';

    private string $botToken;
    private string $chatId;

    public function __construct()
    {
        $this->botToken = (string) config('services.telegram.bot_token', '');
        $this->chatId = (string) config('services.telegram.chat_id', '');
    }

    public function isConfigured(): bool
    {
        return $this->botToken !== '' && $this->chatId !== '';
    }

    /**
     * Kirim plain message ke Telegram chat.
     *
     * @return bool true kalau sukses kirim, false kalau gagal / not configured
     */
    public function send(string $message, string $severity = self::SEVERITY_INFO): bool
    {
        if (! $this->isConfigured()) {
            Log::debug('TelegramAlertService: skipped (not configured)');

            return false;
        }

        $emoji = match ($severity) {
            self::SEVERITY_CRITICAL => '🔴',
            self::SEVERITY_WARNING => '⚠️',
            default => 'ℹ️',
        };

        $text = "{$emoji} *SIBERMAS*\n\n".$message;

        try {
            $response = Http::timeout(10)->post(
                "https://api.telegram.org/bot{$this->botToken}/sendMessage",
                [
                    'chat_id' => $this->chatId,
                    'text' => $text,
                    'parse_mode' => 'Markdown',
                    'disable_web_page_preview' => true,
                ]
            );

            if ($response->successful()) {
                return true;
            }

            Log::warning('Telegram alert failed', [
                'status' => $response->status(),
                'body' => mb_substr($response->body(), 0, 500),
            ]);

            return false;
        } catch (\Throwable $e) {
            Log::warning('Telegram alert exception: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Kirim alert terstruktur dengan context (untuk health check alerts).
     *
     * @param  array<string, mixed>  $context
     */
    public function alertHealthIssue(string $title, array $context = []): bool
    {
        $lines = ["*{$title}*"];
        $lines[] = '';

        foreach ($context as $key => $value) {
            $formatted = is_scalar($value) ? (string) $value : json_encode($value);
            $lines[] = "• *{$key}*: `{$formatted}`";
        }

        $lines[] = '';
        $lines[] = '_Server: '.gethostname().' · '.now()->toIso8601String().'_';

        return $this->send(implode("\n", $lines), self::SEVERITY_CRITICAL);
    }
}
