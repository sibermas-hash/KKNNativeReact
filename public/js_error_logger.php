<?php
$log = date('Y-m-d H:i:s') . ' - ' . file_get_contents('php://input') . PHP_EOL;
file_put_contents(__DIR__.'/../storage/logs/js_errors.log', $log, FILE_APPEND);
echo "OK";
