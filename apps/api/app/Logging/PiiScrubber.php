<?php

declare(strict_types=1);

namespace App\Logging;

use Monolog\LogRecord;

/**
 * R13-OPS-015: Monolog processor that redacts PII before records hit the
 * file writer. Sentry has its own scrubbing; this exists so local
 * `storage/logs/laravel-*.log` files don't leak NIK/NIM/password/token.
 *
 * Matches are replaced with `[REDACTED]` inline. Kept deliberately simple
 * and fast — no regex recursion.
 */
class PiiScrubber
{
    /** @var list<array{pattern: string, replacement: string}> */
    private const PATTERNS = [
        // Passwords anywhere in "password=..." / "password": "..." form.
        ['pattern' => '/(?i)(password["\'\s:=]+)[^\s,"\']{3,}/', 'replacement' => '$1[REDACTED]'],
        // Bearer tokens and Sanctum `id|hash` tokens.
        ['pattern' => '/(?i)bearer\s+[A-Za-z0-9\-_\.]+/', 'replacement' => 'Bearer [REDACTED]'],
        ['pattern' => '/\b\d+\|[A-Za-z0-9]{20,}\b/', 'replacement' => '[TOKEN_REDACTED]'],
        // NIK (16 digits) — mask middle 8 to keep last-4 debuggable.
        ['pattern' => '/\b(\d{4})\d{8}(\d{4})\b/', 'replacement' => '$1********$2'],
        // NIM (typically 10-12 digits at UIN Saizu — masked middle).
        ['pattern' => '/(?i)(nim["\'\s:=]+)(\d{3})\d{5,8}(\d{2})/', 'replacement' => '$1$2***$3'],
    ];

    public function __invoke(LogRecord $record): LogRecord
    {
        $message = $record->message;
        foreach (self::PATTERNS as $rule) {
            $result = preg_replace($rule['pattern'], $rule['replacement'], $message);
            if (is_string($result)) {
                $message = $result;
            }
        }

        // Scrub simple keys in context too (top-level only; keep it cheap).
        $context = $record->context;
        foreach (['password', 'password_confirmation', 'current_password', 'token', 'api_token', 'access_token', 'secret', 'secret'] as $sensitive) {
            if (array_key_exists($sensitive, $context)) {
                $context[$sensitive] = '[REDACTED]';
            }
        }

        return $record->with(message: $message, context: $context);
    }
}
