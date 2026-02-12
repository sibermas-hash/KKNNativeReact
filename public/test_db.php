<?php
header('Content-Type: text/plain');
echo "--- WEB DB TEST START ---\n";

try {
    $host = '127.0.0.1';
    $port = '5432';
    $db   = 'kknuinsaizu';
    $user = 'kknuinsaizu';
    $pass = 'kknuinsaizu@2016';

    $dsn = "pgsql:host=$host;port=$port;dbname=$db";
    $pdo = new PDO($dsn, $user, $pass);
    echo "Connection Successful via TCP (127.0.0.1)\n";
    
    $res = $pdo->query("SELECT count(*) FROM users");
    echo "Users count: " . $res->fetchColumn() . "\n";

} catch (PDOException $e) {
    echo "Connection Failed via TCP (127.0.0.1): " . $e->getMessage() . "\n";
}

try {
    $dsn = "pgsql:host=localhost;port=5432;dbname=$db";
    $pdo = new PDO($dsn, $user, $pass);
    echo "Connection Successful via localhost (Socket?)\n";
} catch (PDOException $e) {
    echo "Connection Failed via localhost: " . $e->getMessage() . "\n";
}

echo "--- WEB DB TEST END ---\n";
