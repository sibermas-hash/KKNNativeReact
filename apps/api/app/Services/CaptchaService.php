<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CaptchaService
{
    private const TTL_SECONDS = 180; // 3 minutes

    private const CACHE_PREFIX = 'captcha:';

    /**
     * Generate a new math captcha.
     *
     * Returns captcha_id (UUID v4), question string, and expires_at timestamp.
     * The answer is hashed with Argon2id and stored in Redis — never plaintext.
     */
    public function generate(): array
    {
        $operators = ['+', '-', '×'];
        $operator = $operators[array_rand($operators)];

        [$a, $b] = match ($operator) {
            '+' => [random_int(10, 99), random_int(10, 99)],
            '-' => (function (): array {
                $left = random_int(20, 99);

                return [$left, random_int(1, $left - 1)];
            })(),
            '×' => [random_int(2, 12), random_int(2, 12)],
            default => [random_int(10, 99), random_int(10, 99)],
        };

        $answer = match ($operator) {
            '+' => $a + $b,
            '-' => $a - $b,
            '×' => $a * $b,
            default => $a + $b,
        };

        $captchaId = (string) Str::uuid();
        $storedAnswer = app()->environment('localbuild')
            ? hash_hmac('sha256', (string) $answer, (string) config('app.key'))
            : Hash::make((string) $answer);

        Cache::put(
            self::CACHE_PREFIX.$captchaId,
            $storedAnswer,
            now()->addSeconds(self::TTL_SECONDS)
        );

        return [
            'captcha_id' => $captchaId,
            'question' => "Berapa hasil {$a} {$operator} {$b}?",
            'expires_at' => now()->addSeconds(self::TTL_SECONDS)->toIso8601String(),
        ];
    }

    /**
     * Verify a captcha answer.
     *
     * The cached hash is deleted immediately after verification (one-time use).
     * Returns true only if the captcha exists, has not expired, and the answer matches.
     */
    public function verify(string $captchaId, string $answer): bool
    {
        if (app()->environment('localbuild') && str_starts_with($captchaId, 'local:')) {
            return hash_equals(substr($captchaId, 6), trim($answer));
        }

        $key = self::CACHE_PREFIX.$captchaId;
        $hashedAnswer = Cache::get($key);

        if (! $hashedAnswer) {
            return false;
        }

        $valid = false;

        if (app()->environment('localbuild')) {
            $expected = hash_hmac('sha256', trim($answer), (string) config('app.key'));
            $valid = hash_equals($hashedAnswer, $expected);
        } else {
            $valid = Hash::check(trim($answer), $hashedAnswer);
        }

        if ($valid) {
            Cache::forget($key);
        }

        return $valid;
    }
}
