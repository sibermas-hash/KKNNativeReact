<?php

namespace App\Constants;

/**
 * Role constants for use in middleware and authorization.
 * ISSUE-RBAC-001 Fix: Prevent typos in role names that could cause authorization bypass.
 * 
 * Usage:
 * Route::middleware(['role:' . Roles::SUPERADMIN . '|' . Roles::FACULTY_ADMIN])->group(...);
 */
class Roles
{
    public const SUPERADMIN = 'superadmin';
    public const FACULTY_ADMIN = 'faculty_admin';
    public const DPL = 'dpl';
    public const STUDENT = 'student';

    /**
     * Get all available roles.
     */
    public static function all(): array
    {
        return [
            self::SUPERADMIN,
            self::FACULTY_ADMIN,
            self::DPL,
            self::STUDENT,
        ];
    }

    /**
     * Check if a role is valid.
     */
    public static function isValid(string $role): bool
    {
        return in_array($role, self::all(), true);
    }
}
