<?php

namespace App\Helpers;

use Carbon\Carbon;

class PasswordHelper
{
    /**
     * Generate a default password from a birth date.
     *
     * Format: DDMMYYYY (e.g. 15021990 for Feb 15, 1990).
     * Fallback: the username (NIP/NIM) if no birth date is available.
     */
    public static function fromBirthDate(?string $birthDate, string $username): string
    {
        if (!empty($birthDate)) {
            return Carbon::parse($birthDate)->format('dmY');
        }

        return $username;
    }
}
