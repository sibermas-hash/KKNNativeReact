<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CaptchaService
{
    private const TTL_SECONDS = 300; // 5 minutes

    private const CACHE_PREFIX = 'captcha:';

    /**
     * Generate a new math captcha.
     *
     * Returns captcha_id (UUID v4), question string, and expires_at timestamp.
     * The answer is hashed with Argon2id and stored in Redis — never plaintext.
     */
    public function generate(): array
    {
        $operators = ['+', '-'];
        $operator = $operators[array_rand($operators)];

        $a = random_int(2, 20);
        $b = match ($operator) {
            '+' => random_int(1, 20),
            '-' => random_int(1, $a - 1),
            default => random_int(1, 20),
        };

        $answer = match ($operator) {
            '+' => $a + $b,
            '-' => $a - $b,
            default => $a + $b,
        };

        $captchaId = (string) Str::uuid();
        $hashedAnswer = Hash::make((string) $answer);

        Cache::put(
            self::CACHE_PREFIX.$captchaId,
            $hashedAnswer,
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
        $key = self::CACHE_PREFIX.$captchaId;
        $hashedAnswer = Cache::get($key);

        if (! $hashedAnswer) {
            return false;
        }

        // Delete immediately — one-time use
        Cache::forget($key);

        // Verify answer against Argon2id hash
        return Hash::check(trim($answer), $hashedAnswer);
    }
}
