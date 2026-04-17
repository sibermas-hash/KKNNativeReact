<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use App\Models\KKN\JenisKkn;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

echo 'Database connection: '.DB::connection()->getDatabaseName()."\n";
echo 'JenisKkn count: '.JenisKkn::count()."\n";
foreach (JenisKkn::all() as $j) {
    echo "- {$j->code}: {$j->name}\n";
}
