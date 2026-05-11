<?php

declare(strict_types=1);

namespace App\Sentry;

use Sentry\Event;
use Sentry\EventHint;

/**
 * Invokable callback for Sentry `before_send`.
 *
 * Dipindah dari closure di config/sentry.php supaya `php artisan config:cache`
 * tidak gagal serialize. Laravel melarang closure di direktori config/ karena
 * cache engine pakai `var_export()`.
 *
 * Tanggung jawab:
 *   (a) Drop health-check noise (/health, /ready, /up) — return null.
 *   (b) Scrub sensitive request fields (body, query, cookies, headers) —
 *       ganti nilai dengan "[Filtered]" untuk key yang masuk daftar.
 *
 * H-007 fix: pakai \Sentry\Event secara benar, dan scrub credential/PII dari
 * semua channel request yang bisa bocor.
 */
class BeforeSendScrub
{
    private const SENSITIVE_KEYS = [
        'password', 'password_confirmation', 'current_password', 'new_password',
        'token', '_token', 'api_key', 'x-api-key', 'x-admin-secret',
        'authorization', 'cookie', 'set-cookie',
        'nik', 'nim', 'nip',
        'birth_date', 'tanggal_lahir',
        'sibermas_token', 'sibermas_session',
        'captcha_answer', 'secret',
    ];

    private const HEALTH_CHECK_PATHS = ['/health', '/ready', '/up'];

    public function __invoke(Event $event, ?EventHint $hint = null): ?Event
    {
        $request = $event->getRequest();

        // (a) Drop health-check noise
        $url = $request['url'] ?? '';
        if (is_string($url)) {
            foreach (self::HEALTH_CHECK_PATHS as $path) {
                if (str_contains($url, $path)) {
                    return null;
                }
            }
        }

        // (b) Scrub sensitive request fields
        if (! empty($request)) {
            foreach (['data', 'query_string', 'cookies', 'headers'] as $field) {
                if (! empty($request[$field]) && is_array($request[$field])) {
                    $request[$field] = $this->scrub($request[$field]);
                }
            }
            $event->setRequest($request);
        }

        return $event;
    }

    /**
     * Recursive scrub — Sentry payload hanya nested 1–2 level jadi iteratif
     * cukup. Key dicocokkan case-insensitive.
     *
     * @param  array<mixed, mixed>  $data
     * @return array<mixed, mixed>
     */
    private function scrub(array $data): array
    {
        foreach ($data as $key => $value) {
            $lower = is_string($key) ? strtolower($key) : $key;

            if (is_string($lower) && in_array($lower, self::SENSITIVE_KEYS, true)) {
                $data[$key] = '[Filtered]';
                continue;
            }

            if (is_array($value)) {
                $data[$key] = $this->scrub($value);
            }
        }

        return $data;
    }
}
