<?php

declare(strict_types=1);

namespace App\Constants;

final class AppConstants
{
    // Time
    public const HOURS_IN_DAY = 24;

    public const MINUTES_IN_HOUR = 60;

    // Pagination
    public const DEFAULT_PER_PAGE = 15;

    public const MAX_PER_PAGE = 100;

    // Files
    public const MAX_FILE_SIZE_MB = 10;

    public const MAX_AVATAR_SIZE_MB = 2;

    // GPS
    public const MAX_GPS_ACCURACY_METERS = 100;

    public const MAX_BACKDATE_HOURS = 24;

    // Batch
    public const MAX_BATCH_LIMIT = 50;

    // Password
    public const MIN_PASSWORD_LENGTH = 8;

    // Cache
    public const CACHE_TTL_SHORT = 60;

    public const CACHE_TTL_MEDIUM = 3600;

    public const CACHE_TTL_LONG = 86400;
}
