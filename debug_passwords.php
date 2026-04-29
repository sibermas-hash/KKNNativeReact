<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$password = env('KKN_LOCAL_SEED_PASSWORD', 'password');
echo "Default Password from ENV: $password\n";

$users = User::limit(5)->get();
echo "Checking first 5 users:\n";
foreach ($users as $user) {
    $match = Hash::check($password, $user->password) ? 'YES' : 'NO';
    echo "ID: {$user->id} | Username: {$user->username} | Match: $match | Hash: {$user->password}\n";
}
