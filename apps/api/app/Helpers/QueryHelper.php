<?php

declare(strict_types=1);

namespace App\Helpers;

/**
 * Shared query utilities.
 *
 * R3-C003 fix: prevents LIKE wildcard injection (%,_,\) in search inputs.
 */
class QueryHelper
{
    /**
     * Escape SQL LIKE special characters so user input is treated as literals.
     *
     * Usage:
     *   $safe = QueryHelper::escapeLike($request->input('search'));
     *   $query->where('title', 'like', "%{$safe}%");
     *
     * Without this, a user sending `search=%%%%` forces full-table scans.
     */
    public static function escapeLike(string $value): string
    {
        return str_replace(
            ['\\', '%', '_'],
            ['\\\\', '\\%', '\\_'],
            $value
        );
    }
}
