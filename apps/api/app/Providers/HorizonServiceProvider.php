<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class HorizonServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        if (! class_exists(\Laravel\Horizon\Horizon::class)) {
            return;
        }

        \Laravel\Horizon\Horizon::auth(function ($request) {
            $user = $request->user();
            if (! $user) {
                return false;
            }
            return $user->hasRole(['superadmin', 'admin']);
        });

        \Laravel\Horizon\Horizon::dark('auto');
    }
}
