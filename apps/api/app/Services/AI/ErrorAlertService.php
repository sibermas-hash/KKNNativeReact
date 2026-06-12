<?php

declare(strict_types=1);

namespace App\Services\AI;

use App\Services\TelegramAlertService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * ErrorAlertService — Real-time AI-powered error alerting via Telegram.
 *
 * Monitors:
 * - Backend exceptions (via exception handler)
 * - Frontend errors (via /api/log-error endpoint)
 * - Queue/service failures (via Job failed event)
 *
 * AI analyzes the error and provides:
 * - Root cause hypothesis
 * - Severity assessment
 * - Suggested fix
 * - Impact estimation
 */
class ErrorAlertService
{
    use HasAiFailover;

    private const DEDUP_TTL_MINUTES = 15;

    private const DEDUP_PREFIX = 'error_alert:';

    private const MAX_ALERTS_PER_HOUR = 20;

    private const HOUR_COUNTER_KEY = 'error_alert:hour_count';

    public function __construct(
        private TelegramAlertService $telegram,
    ) {}

    /**
     * Alert on backend exception (called from exception handler).
     */
    public function alertBackendError(\Throwable $e, ?string $url = null, ?int $userId = null): bool
    {
        if (! $this->shouldAlert()) {
            return false;
        }

        $fingerprint = $this->fingerprint('backend', $e->getMessage(), $e->getFile(), $e->getLine());
        if ($this->isDuplicate($fingerprint)) {
            return false;
        }

        $context = [
            'source' => 'Backend',
            'type' => class_basename($e),
            'message' => mb_substr($e->getMessage(), 0, 500),
            'file' => str_replace(base_path().'/', '', $e->getFile()).':'.$e->getLine(),
            'url' => $url,
            'user_id' => $userId,
            'trace_snippet' => $this->getTraceSnippet($e),
        ];

        return $this->sendAlert($context, $fingerprint);
    }

    /**
     * Alert on frontend error (called from log-error endpoint).
     */
    public function alertFrontendError(string $message, ?string $url = null, ?string $stack = null, ?int $userId = null): bool
    {
        if (! $this->shouldAlert()) {
            return false;
        }

        $fingerprint = $this->fingerprint('frontend', $message, $url ?? '', 0);
        if ($this->isDuplicate($fingerprint)) {
            return false;
        }

        $context = [
            'source' => 'Frontend',
            'type' => 'JavaScriptError',
            'message' => mb_substr($message, 0, 500),
            'file' => $url ?? 'unknown',
            'url' => $url,
            'user_id' => $userId,
            'trace_snippet' => $stack ? mb_substr($stack, 0, 300) : null,
        ];

        return $this->sendAlert($context, $fingerprint);
    }

    /**
     * Alert on queue job failure.
     */
    public function alertJobFailed(string $jobClass, string $errorMessage, ?string $queue = null): bool
    {
        if (! $this->shouldAlert()) {
            return false;
        }

        $fingerprint = $this->fingerprint('job', $jobClass, $errorMessage, 0);
        if ($this->isDuplicate($fingerprint)) {
            return false;
        }

        $context = [
            'source' => 'Queue Worker',
            'type' => 'JobFailed',
            'message' => mb_substr($errorMessage, 0, 500),
            'file' => $jobClass,
            'url' => "queue:{$queue}",
            'user_id' => null,
            'trace_snippet' => null,
        ];

        return $this->sendAlert($context, $fingerprint);
    }

    private function sendAlert(array $context, string $fingerprint): bool
    {
        $aiAnalysis = $this->analyzeError($context);

        $severity = $this->assessSeverity($context);
        $emoji = match ($severity) {
            'critical' => '🔴',
            'high' => '🟠',
            'medium' => '🟡',
            default => '⚪',
        };

        $message = "{$emoji} *ERROR — {$context['source']}*\n\n"
            ."*Type:* `{$context['type']}`\n"
            ."*Message:* _{$this->escapeMarkdown(mb_substr($context['message'], 0, 200))}_\n"
            ."*File:* `{$context['file']}`\n"
            .($context['url'] ? "*URL:* `{$context['url']}`\n" : '')
            .($context['user_id'] ? "*User:* `{$context['user_id']}`\n" : '')
            ."\n*AI Analysis:*\n{$aiAnalysis}\n"
            ."\n_".now()->format('H:i:s d/m/Y').' · '.gethostname().'_';

        $telegramSeverity = match ($severity) {
            'critical' => TelegramAlertService::SEVERITY_CRITICAL,
            'high' => TelegramAlertService::SEVERITY_WARNING,
            default => TelegramAlertService::SEVERITY_INFO,
        };

        $sent = $this->telegram->send($message, $telegramSeverity);

        if ($sent) {
            $this->markSent($fingerprint);
            $this->incrementHourCounter();
        }

        return $sent;
    }

    private function scrubContext(array $context): array
    {
        $scrubbed = $context;

        // Remove path segments that may contain passwords
        if (isset($scrubbed['message'])) {
            $scrubbed['message'] = preg_replace(
                ['/password=\S+/i', '/secret=\S+/i', '/token=\S+/i', '/key=\S+/i', '/api[_-]?key=\S+/i'],
                ['password=***', 'secret=***', 'token=***', 'key=***', 'api_key=***'],
                $scrubbed['message']
            );
        }

        // Remove user_id from context sent to external AI
        unset($scrubbed['user_id']);

        // Scrub query params in URL
        if (isset($scrubbed['url'])) {
            $scrubbed['url'] = preg_replace('/\?.*/', '?[query_redacted]', (string) $scrubbed['url']);
        }

        // Truncate trace to remove sensitive vendor paths
        if (isset($scrubbed['trace_snippet'])) {
            $scrubbed['trace_snippet'] = (string) mb_substr((string) $scrubbed['trace_snippet'], 0, 200);
        }

        return $scrubbed;
    }

    private function analyzeError(array $context): string
    {
        $context = $this->scrubContext($context);
        $tiers = $this->loadAiTiers(
            (string) config('ai.routing.alerting.model', 'ag/gemini-3-flash'),
            true
        );
        $timeout = (int) config('ai.routing.alerting.timeout', 15);
        $temperature = (float) config('ai.routing.alerting.temperature', 0.2);
        $maxTokens = (int) config('ai.routing.alerting.max_tokens', 200);

        $prompt = 'Analisis error berikut dari sistem KKN (SIBERMAS). '
            ."Berikan dalam 2-3 kalimat: (1) kemungkinan root cause, (2) dampak ke user, (3) saran fix cepat.\n\n"
            ."Source: {$context['source']}\n"
            ."Type: {$context['type']}\n"
            ."Message: {$context['message']}\n"
            ."File: {$context['file']}\n"
            .($context['trace_snippet'] ? "Trace: {$context['trace_snippet']}\n" : '');

        foreach ($tiers as $tier) {
            if (empty($tier['key'])) {
                continue;
            }

            try {
                $response = Http::withToken($tier['key'])
                    ->timeout($timeout)
                    ->post(rtrim($tier['url'], '/').'/chat/completions', [
                        'model' => $tier['model'],
                        'stream' => false,
                        'messages' => [
                            ['role' => 'system', 'content' => 'Anda adalah DevOps engineer untuk sistem KKN universitas. Analisis error singkat dan actionable dalam Bahasa Indonesia. Max 3 kalimat.'],
                            ['role' => 'user', 'content' => $prompt],
                        ],
                        'temperature' => $temperature,
                        'max_tokens' => $maxTokens,
                    ]);

                if ($response->successful()) {
                    $content = $response->json('choices.0.message.content', '');
                    if ($content !== '') {
                        return trim($content);
                    }
                }
            } catch (\Throwable $e) {
                Log::debug('ErrorAlertService AI tier failed: '.$e->getMessage());
            }
        }

        return $this->fallbackAnalysis($context);
    }

    private function fallbackAnalysis(array $context): string
    {
        return match ($context['source']) {
            'Frontend' => 'Error JavaScript terdeteksi. Periksa console browser dan network tab untuk detail.',
            'Queue Worker' => 'Job gagal diproses. Periksa payload dan retry manual jika diperlukan.',
            default => 'Exception terdeteksi. Periksa log Laravel untuk stack trace lengkap.',
        };
    }

    private function assessSeverity(array $context): string
    {
        $message = strtolower($context['message']);
        $type = strtolower($context['type']);

        // Critical: database, auth, payment
        if (str_contains($message, 'database') || str_contains($message, 'connection refused')
            || str_contains($type, 'pdo') || str_contains($message, 'deadlock')) {
            return 'critical';
        }

        // High: auth failures, permission issues
        if (str_contains($type, 'auth') || str_contains($message, 'unauthorized')
            || str_contains($message, 'token') || str_contains($type, 'permission')) {
            return 'high';
        }

        // Medium: validation, not found
        if (str_contains($type, 'validation') || str_contains($type, 'notfound')
            || str_contains($type, '404')) {
            return 'low';
        }

        return 'medium';
    }

    private function shouldAlert(): bool
    {
        if (! $this->telegram->isConfigured()) {
            return false;
        }

        // Rate limit: max N alerts per hour
        $count = (int) Cache::get(self::HOUR_COUNTER_KEY, 0);

        return $count < self::MAX_ALERTS_PER_HOUR;
    }

    private function fingerprint(string $source, string $message, string $file, int $line): string
    {
        return md5("{$source}:{$file}:{$line}:".mb_substr($message, 0, 100));
    }

    private function isDuplicate(string $fingerprint): bool
    {
        return Cache::has(self::DEDUP_PREFIX.$fingerprint);
    }

    private function markSent(string $fingerprint): void
    {
        Cache::put(self::DEDUP_PREFIX.$fingerprint, true, now()->addMinutes(self::DEDUP_TTL_MINUTES));
    }

    private function incrementHourCounter(): void
    {
        $key = self::HOUR_COUNTER_KEY;
        if (! Cache::has($key)) {
            Cache::put($key, 1, now()->addHour());
        } else {
            Cache::increment($key);
        }
    }

    private function getTraceSnippet(\Throwable $e): string
    {
        $trace = $e->getTraceAsString();
        // Get first 3 non-vendor frames
        $lines = explode("\n", $trace);
        $relevant = array_filter($lines, fn ($l) => ! str_contains($l, '/vendor/'));

        return mb_substr(implode("\n", array_slice(array_values($relevant), 0, 3)), 0, 300);
    }

    private function escapeMarkdown(string $text): string
    {
        return str_replace(['_', '*', '`', '['], ['\\_', '\\*', '\\`', '\\['], $text);
    }
}
