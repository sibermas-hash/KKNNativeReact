<?php

declare(strict_types=1);

namespace App\Helpers;

use Illuminate\Support\Str;

class PasswordHelper
{
    /**
     * Generate a cryptographically random default password.
     *
     * A 24-char random password is unguessable; callers should pair this with
     * `must_change_password = true` and fire a password-reset link so the user
     * can claim the account through a verifiable email flow.
     *
     * See audit C-002 (AUDIT_STATUS.md) — the prior birth-date-based default
     * was trivially derivable from public sources.
     */
    public static function generateSecureDefault(): string
    {
        return Str::password(24, letters: true, numbers: true, symbols: true, spaces: false);
    }

    public static function fromBirthDate(mixed $birthDate): ?string
    {
        if (empty($birthDate)) {
            return null;
        }

        try {
            return \Carbon\Carbon::parse((string) $birthDate)->format('dmY');
        } catch (\Throwable) {
            return null;
        }
    }
}
