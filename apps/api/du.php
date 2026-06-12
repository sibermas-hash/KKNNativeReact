<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use App\Services\StudentSyncService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

// Force welcome email off at config level too (belt + suspenders)
config(['services.sync.send_welcome_email' => false]);

$f = storage_path('app/legacy_master_matches.jsonl');
$lines = file($f, FILE_IGNORE_NEW_LINES);
echo "to_upsert=".count($lines)."\n";

$svc = app(StudentSyncService::class);
$ok=0; $false=0; $err=0; $i=0; $errSamples=[];
$t0=microtime(true);
foreach ($lines as $ln) {
    $r = json_decode($ln, true);
    if (!$r || empty($r['nim'])) { continue; }
    $i++;
    try {
        // useCachedMaps=false (fresh maps), dispatchWelcomeEmail=false
        $res = $svc->upsertStudent($r, false, false);
        if ($res === true) $ok++; else $false++;
    } catch (\Throwable $e) {
        $err++;
        if (count($errSamples)<8) $errSamples[]=$r['nim'].': '.substr($e->getMessage(),0,90);
    }
    if ($i % 300 === 0) {
        $dt=round(microtime(true)-$t0,0);
        echo "progress i=$i ok=$ok false=$false err=$err elapsed={$dt}s\n";
    }
}
$dt=round(microtime(true)-$t0,0);
echo "DONE i=$i ok=$ok false=$false err=$err elapsed={$dt}s\n";
if ($errSamples) echo "err_samples=".json_encode($errSamples)."\n";

// Verify how many match NIMs now exist in mahasiswa
$nims = array_map(fn($l)=>json_decode($l,true)['nim']??null, $lines);
$nims = array_values(array_filter($nims));
$now=0;
foreach (array_chunk($nims,1000) as $ck) $now += DB::table('mahasiswa')->whereIn('nim',$ck)->count();
echo "matches_now_in_mahasiswa=$now / ".count($nims)."\n";
