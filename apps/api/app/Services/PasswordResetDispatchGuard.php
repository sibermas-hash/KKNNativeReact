<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class PasswordResetDispatchGuard
{
    public function send(string $email, array $meta = [], bool $force = false): bool
    {
        $email = Str::lower(trim($email));

        if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        $key = 'password-reset-dispatch:email:'.sha1($email);
        $dayKey = $key.':day';
        $minuteKey = $key.':minute';

        if (! $force && (
            RateLimiter::tooManyAttempts($minuteKey, 1) ||
            RateLimiter::tooManyAttempts($dayKey, 3)
        )) {
            Log::info('password reset dispatch suppressed by SMTP guard', [
                ...$meta,
                'email_hash' => sha1($email),
            ]);

            return false;
        }

        RateLimiter::hit($minuteKey, 60);
        RateLimiter::hit($dayKey, 86400);

        $status = Password::sendResetLink(['email' => $email]);

        return $status === Password::RESET_LINK_SENT;
    }
}
