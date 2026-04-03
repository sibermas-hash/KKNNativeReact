<?php

namespace App\Helpers;

use Illuminate\Support\Str;

class PasswordHelper
{
    /**
     * Generate a secure random default password.
     *
     * Returns a 12-character random password.
     * The $birthDate and $username params are kept for backward compatibility
     * but are no longer used in password generation.
     */
    public static function fromBirthDate(?string $birthDate, string $username): string
    {
        return Str::password(12);
    }
}
