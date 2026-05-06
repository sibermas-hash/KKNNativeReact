<?php

declare(strict_types=1);

namespace App\Helpers;

class PasswordHelper
{
    /**
     * Generate default password from birth date in DDMMYYYY format.
     * Falls back to username if birth date is not available.
     */
    public static function fromBirthDate(?string $birthDate, string $username): string
    {
        if ($birthDate) {
            try {
                return (new \DateTime($birthDate))->format('dmY');
            } catch (\Exception) {
                // fall through to fallback
            }
        }

        return $username;
    }
}
