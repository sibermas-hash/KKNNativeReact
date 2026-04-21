<?php

/**
 * Minimalist JS Error Logger
 * This file is called directly from resources/views/app.blade.php
 * to log frontend errors without booting the entire Laravel framework.
 */

// Define path to log file
$logFile = __DIR__.'/../storage/logs/js_errors.log';

// Ensure the directory exists
$logDir = dirname($logFile);
if (! is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}

// Get the error message from the request body
$errorData = file_get_contents('php://input');

if ($errorData) {
    $timestamp = date('Y-m-d H:i:s');
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    $url = $_SERVER['HTTP_REFERER'] ?? 'unknown';

    $logEntry = "[$timestamp] [IP: $ip] [URL: $url]\n";
    $logEntry .= "[User Agent: $userAgent]\n";
    $logEntry .= "Error: $errorData\n";
    $logEntry .= "--------------------------------------------------------------------------------\n";

    // Append to log file
    file_put_contents($logFile, $logEntry, FILE_APPEND);
}

// Respond with 204 No Content
header('HTTP/1.1 204 No Content');
exit;
