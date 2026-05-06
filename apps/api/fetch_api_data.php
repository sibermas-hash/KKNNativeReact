#!/usr/bin/env php
<?php
// Fetch all 4 API endpoints and save to storage/logs/
$token = '2|qvOvRxbr10wO72F3ktSDWWPrTii4MOaj8sVbkMEC7c7fcde3';
$baseUrl = 'https://api.uinsaizu.ac.id/api';
$outputDir = __DIR__ . '/storage/logs';

$endpoints = [
    'api_orgs.json'      => '/sync/organizations?page=1&per_page=100',
    'api_programs.json'   => '/programs?page=1&per_page=10',
    'api_dosen.json'      => '/sync/dosen?page=1&per_page=2',
    'api_mahasiswa.json'  => '/sync/mahasiswa?page=1&per_page=2',
];

foreach ($endpoints as $filename => $endpoint) {
    $url = $baseUrl . $endpoint;
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            "Authorization: Bearer {$token}",
        ],
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    $path = "{$outputDir}/{$filename}";
    if ($response !== false) {
        file_put_contents($path, json_encode(json_decode($response, true), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo "{$filename}: HTTP {$httpCode}, " . strlen($response) . " bytes\n";
    } else {
        echo "{$filename}: CURL ERROR - {$error}\n";
    }
}

echo "\nDone! Files saved to {$outputDir}/\n";
