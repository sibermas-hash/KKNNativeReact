<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use App\Models\ApiKey;
use Illuminate\Contracts\Console\Kernel;

$key = new ApiKey;
$key->key = 'sk_test_123';
echo 'Key attribute: '.$key->getAttributes()['key']."\n";
echo 'Looks hashed: '.(str_starts_with($key->getAttributes()['key'], '$') ? 'Yes' : 'No')."\n";
