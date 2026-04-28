<?php

// Simple reconciler script: compares counts between master API and local DB for key entities.
// Usage: php docs/scripts/reconcile_master_vs_local.php

require __DIR__ . '/../../vendor/autoload.php';

use App\Services\MasterApiService;
use Illuminate\Support\Facades\DB;

$app = require __DIR__ . '/../../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

/** @var MasterApiService $master */
$master = app(MasterApiService::class);

$entities = [
    'mahasiswa' => 'mahasiswa',
    'dosen' => 'dosen',
    'fakultas' => 'fakultas',
    'prodi' => 'prodi',
    'tahun_akademik' => 'tahun_akademik',
];

$report = [];
foreach ($entities as $key => $endpoint) {
    echo "Checking {$key}...\n";
    try {
        $masterData = $master->get("/sync/{$endpoint}", ['per_page' => 1]);
        // If master returns metadata->total, use it. Otherwise, fallback to counting via a separate endpoint is recommended.
        $masterCount = is_array($masterData) && isset($masterData['meta']['total']) ? (int) $masterData['meta']['total'] : count($masterData);
    } catch (\Throwable $e) {
        echo "Failed to fetch from master for {$key}: " . $e->getMessage() . "\n";
        $masterCount = -1;
    }

    $localCount = DB::table($key)->count();

    $report[$key] = [
        'master' => $masterCount,
        'local' => $localCount,
        'diff' => $masterCount === -1 ? 'error' : ($localCount - $masterCount),
    ];
}

$file = __DIR__ . '/../../storage/reports/reconcile_' . date('Ymd_His') . '.json';
@mkdir(dirname($file), 0755, true);
file_put_contents($file, json_encode($report, JSON_PRETTY_PRINT));

echo "Reconciliation report written to: {$file}\n";
print_r($report);
