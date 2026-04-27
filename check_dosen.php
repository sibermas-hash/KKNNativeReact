<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$dosenCount = \App\Models\KKN\Dosen::count();
file_put_contents('dosen_count.txt', $dosenCount);
