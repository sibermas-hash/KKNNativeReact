<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver as GdDriver;
use Intervention\Image\Drivers\Imagick\Driver as ImagickDriver;

class ImageServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(ImageManager::class, function ($app) {
            $driver = config('image.driver', 'gd');

            return match ($driver) {
                'imagick' => new ImageManager(new ImagickDriver()),
                default => new ImageManager(new GdDriver()),
            };
        });
    }

    public function boot(): void
    {
        $this->publishes([
            __DIR__.'/../../config/image.php' => config_path('image.php'),
        ], 'image-config');
    }
}