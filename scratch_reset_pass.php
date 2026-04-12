<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$u = \App\Models\User::where('username', 'admin')->first();
if ($u) {
    $u->password = 'Password#123';
    $u->save();
    echo "Password updated for " . $u->username . "\n";
} else {
    echo "User not found\n";
}
