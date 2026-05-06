<?php
// Minimal test - check if pgsql extension exists
$out = [];
$out[] = "PHP Version: " . PHP_VERSION;
$out[] = "pgsql loaded: " . (extension_loaded('pgsql') ? 'YES' : 'NO');
$out[] = "pdo_pgsql loaded: " . (extension_loaded('pdo_pgsql') ? 'YES' : 'NO');
$out[] = "PDO drivers: " . implode(', ', PDO::getAvailableDrivers());

// Try connection only if pdo_pgsql is loaded
if (extension_loaded('pdo_pgsql')) {
    try {
        $pdo = new PDO("pgsql:host=127.0.0.1;port=5432;dbname=kknnative", "kknuinsaizunative", "kknuinsaizu2026native", [PDO::ATTR_TIMEOUT => 3]);
        $out[] = "TCP Connection: OK";
        $count = $pdo->query("SELECT COUNT(*) FROM fakultas")->fetchColumn();
        $out[] = "fakultas count: {$count}";
    } catch (PDOException $e) {
        $out[] = "TCP Connection: " . $e->getMessage();
        // Try unix socket
        try {
            $pdo = new PDO("pgsql:host=/tmp;port=5432;dbname=kknnative", "kknuinsaizunative", "kknuinsaizu2026native", [PDO::ATTR_TIMEOUT => 3]);
            $out[] = "Socket Connection: OK";
            $count = $pdo->query("SELECT COUNT(*) FROM fakultas")->fetchColumn();
            $out[] = "fakultas count: {$count}";
        } catch (PDOException $e2) {
            $out[] = "Socket Connection: " . $e2->getMessage();
        }
    }
}

// Write to a guaranteed location
$path = dirname(__FILE__) . '/db_result.txt';
file_put_contents($path, implode("\n", $out) . "\n");
