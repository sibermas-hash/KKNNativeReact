<?php
header('Content-Type: text/plain');

echo "--- WEB DB TEST ---\n";
echo "PHP_SAPI: " . php_sapi_name() . "\n";

$envFile = __DIR__ . '/../.env';
echo "Checking .env file: " . (file_exists($envFile) ? 'EXISTS' : 'MISSING') . "\n";

// Load .env manually to see what's in it
$envContent = file_get_contents($envFile);
preg_match('/DB_PASSWORD=(.*)/', $envContent, $matches);
$passFromEnv = $matches[1] ?? 'NOT FOUND';
echo "DB_PASSWORD in .env file: $passFromEnv\n";

// Get via getenv
echo "DB_PASSWORD via getenv(): " . (getenv('DB_PASSWORD') ?: 'EMPTY/NOT SET') . "\n";
echo "DB_PASSWORD via \$_ENV: " . (($_ENV['DB_PASSWORD'] ?? 'EMPTY/NOT SET')) . "\n";

// Try raw PDO connection
$host = 'localhost';
$db   = 'kknuinsaizu';
$user = 'kknuinsaizu';
$pass = trim($passFromEnv, '"\''); // Clean quotes

echo "Attempting PDO connection with user '$user' and host '$host'...\n";

try {
    $dsn = "pgsql:host=$host;port=5432;dbname=$db;";
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    echo "SUCCESS: Connected to database!\n";
} catch (PDOException $e) {
    echo "FAILED: " . $e->getMessage() . "\n";
}

// Check current user
echo "\nCurrent system user (posix_getpwuid): " . posix_getpwuid(posix_geteuid())['name'] . "\n";
