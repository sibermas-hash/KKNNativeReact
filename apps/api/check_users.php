<?php
try {
    require __DIR__.'/vendor/autoload.php';
    $app = require_once __DIR__.'/bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();

    $users = \App\Models\User::all();
    echo "Total Users: " . $users->count() . "\n";
    foreach ($users as $user) {
        echo "- " . $user->username . " (Roles: " . implode(',', $user->getRoleNames()->toArray()) . ")\n";
    }
} catch (\Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
