<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$status = $kernel->call('db:seed', ['--class' => 'DosenCsvSeeder']);
$output = $kernel->output();
file_put_contents('seed_output.log', $output);
echo "Done";
