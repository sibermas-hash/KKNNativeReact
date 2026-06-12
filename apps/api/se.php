<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use App\Services\EligibilityService;
use App\Models\KKN\Mahasiswa;
use Illuminate\Support\Facades\DB;

$svc = app(EligibilityService::class);

// Take 3 matched-legacy mahasiswa and run the real eligibility check
$rows = DB::table('legacy_kkn_completed_students as l')
    ->join('mahasiswa as m','m.id','=','l.mahasiswa_id')
    ->whereNotNull('l.mahasiswa_id')
    ->select('m.id','m.nim','m.nama')
    ->limit(3)->get();

foreach ($rows as $row) {
    $m = Mahasiswa::find($row->id);
    try {
        $res = $svc->checkEligibility($m);
        $passed = is_array($res) ? ($res['eligible'] ?? $res['is_eligible'] ?? null) : null;
        // find no_prior_completion check
        $prior = null;
        if (is_array($res) && isset($res['checks'])) {
            foreach ($res['checks'] as $c) {
                if (($c['key']??'')==='no_prior_completion') $prior=$c['passed']??null;
            }
        }
        echo "nim={$row->nim} eligible=".json_encode($passed)." no_prior_completion_passed=".json_encode($prior)."\n";
    } catch (\Throwable $e) {
        echo "nim={$row->nim} ERR ".substr($e->getMessage(),0,120)."\n";
    }
}
