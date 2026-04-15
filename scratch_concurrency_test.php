<?php

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Concurrency;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

try {
    echo "Testing Concurrency...\n";
    $results = Concurrency::run([
        fn () => 1 + 1,
        fn () => 2 + 2,
    ]);
    print_r($results);
    echo "Success!\n";
} catch (Throwable $e) {
    echo 'ERROR: '.$e->getMessage()."\n";
    echo 'Trace: '.$e->getTraceAsString()."\n";
}
