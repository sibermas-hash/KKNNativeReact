<?php

declare(strict_types=1);

namespace App\Sentry;

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
 * NOTE: type hints pada __invoke sengaja dibuat lembut (tanpa reference ke
 * \Sentry\Event / \Sentry\EventHint) supaya class ini dapat di-autoload
 * walaupun package sentry/sentry-laravel belum terpasang (mis. di environment
 * tanpa Sentry DSN). Sentry akan memanggil method ini dengan instance Event
 * yang mengimplementasikan getRequest()/setRequest() — kita duck-type.
 *
 * H-007 fix: scrubbing of sensitive headers/body/cookies/query keys.
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

    /**
     * @param  object  $event  Sentry\Event instance (duck-typed to avoid hard dep)
     * @param  object|null  $hint   Sentry\EventHint instance
     * @return object|null  null → event dropped
     */
    public function __invoke(object $event, ?object $hint = null): ?object
    {
        // Guard: kalau event tidak punya getRequest(), biarkan lewat tanpa scrub.
        if (! method_exists($event, 'getRequest') || ! method_exists($event, 'setRequest')) {
            return $event;
        }

        $request = $event->getRequest();

        // (a) Drop health-check noise
        $url = is_array($request) ? ($request['url'] ?? '') : '';
        if (is_string($url)) {
            foreach (self::HEALTH_CHECK_PATHS as $path) {
                if (str_contains($url, $path)) {
                    return null;
                }
            }
        }

        // (b) Scrub sensitive request fields
        if (is_array($request) && ! empty($request)) {
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
     * Recursive scrub — Sentry payload biasanya hanya nested 1–2 level. Key
     * dicocokkan case-insensitive.
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
