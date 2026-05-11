<?php

use App\Providers\AiConfigServiceProvider;
use App\Providers\AppServiceProvider;
use App\Providers\ImageServiceProvider;
use App\Providers\MasterApiServiceProvider;
use App\Providers\McpServiceProvider;
use Laravel\Ai\AiServiceProvider;

// Telescope + Horizon providers removed 2026-05-10:
//   - laravel/telescope is NOT in composer.json → TelescopeServiceProvider
//     relied on a conditional class_exists guard that PHPStan can't reason
//     about and that silently no-op'd on every boot. config/telescope.php
//     also removed in the same commit.
//   - laravel/horizon likewise not installed; config/horizon.php removed.
//     If you re-introduce them, `composer require laravel/horizon laravel/telescope`
//     first, then re-register here.

return [
    AppServiceProvider::class,
    MasterApiServiceProvider::class,
    AiConfigServiceProvider::class,
    AiServiceProvider::class,
    McpServiceProvider::class,
    ImageServiceProvider::class,
];
