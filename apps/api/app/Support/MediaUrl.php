<?php

namespace App\Support;

final class MediaUrl
{
    public static function publicStorageUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        $cleanPath = ltrim($path, '/');
        $cleanPath = preg_replace('#^storage/#', '', $cleanPath) ?? $cleanPath;
        $baseUrl = (string) config('app.frontend_url', '');

        if ($baseUrl === '') {
            $baseUrl = preg_replace('#/api$#', '', (string) config('app.url')) ?: '';
        }

        $baseUrl = preg_replace('#/api$#', '', rtrim($baseUrl, '/')) ?: '';

        return $baseUrl.'/storage/'.$cleanPath;
    }
}