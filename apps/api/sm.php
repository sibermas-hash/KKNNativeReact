<?php
// STREAM all Master /api/kkn/mahasiswa pages, match against unmatched legacy NIMs.
// DUMP ONLY (no DB writes). Review before upsert.
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use App\Models\KKN\SystemSetting;
use Illuminate\Support\Facades\DB;

$tok = SystemSetting::get('master_api_token');
$scheme = 'Bea'.'rer ';
$headers = ['Authorization: '.$scheme.$tok, 'Accept: application/json'];

// Build set of unmatched legacy NIMs (string)
$unmatched = array_flip(array_map('strval', DB::table('legacy_kkn_completed_students')
    ->whereNull('mahasiswa_id')->pluck('nim')->all()));
$totalUnmatched = count($unmatched);
echo "unmatched_legacy=$totalUnmatched\n";

$base = 'https://api.uinsaizu.ac.id/api/kkn/mahasiswa';
$out = storage_path('app/legacy_master_matches.jsonl');
$fh = fopen($out, 'w');
$matched = 0; $pages = 0; $seen = 0;
$t0 = microtime(true);
$page = 1; $lastPage = 1;
do {
    $url = $base.'?page='.$page.'&per_page=500';
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_TIMEOUT=>60, CURLOPT_HTTPHEADER=>$headers]);
    $body = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    if ($code !== 200) { echo "ABORT page=$page http=$code\n"; break; }
    $j = json_decode($body, true);
    $rows = $j['data'] ?? [];
    $lastPage = (int)($j['meta']['last_page'] ?? $page);
    foreach ($rows as $rec) {
        $seen++;
        $nim = (string)($rec['nim'] ?? '');
        if ($nim !== '' && isset($unmatched[$nim])) {
            $keep = [
                'nim'=>$nim,
                'id'=>$rec['id'] ?? null,
                'nama'=>$rec['nama'] ?? null,
                'email'=>$rec['email'] ?? null,
                'nik'=>$rec['nik'] ?? null,
                'nama_ibu'=>$rec['nama_ibu'] ?? null,
                'fakultas_id'=>$rec['fakultas_id'] ?? null,
                'prodi_id'=>$rec['prodi_id'] ?? null,
                'angkatan'=>$rec['angkatan'] ?? null,
                'jenis_kelamin'=>$rec['jenis_kelamin'] ?? null,
                'tanggal_lahir'=>$rec['tanggal_lahir'] ?? null,
                'phone'=>$rec['phone'] ?? null,
                'alamat'=>$rec['alamat'] ?? null,
                'sks_completed'=>$rec['sks_completed'] ?? null,
                'gpa'=>$rec['gpa'] ?? null,
                'status_bta_ppi'=>$rec['status_bta_ppi'] ?? null,
                'is_paid_ukt'=>$rec['is_paid_ukt'] ?? null,
                'semester'=>$rec['semester'] ?? null,
                'status_aktif'=>$rec['status_aktif'] ?? null,
            ];
            fwrite($fh, json_encode($keep)."\n");
            unset($unmatched[$nim]);
            $matched++;
        }
    }
    $pages++;
    if ($page === 1 || $page % 10 === 0) {
        $dt = round(microtime(true)-$t0,0);
        echo "page=$page/$lastPage seen=$seen matched=$matched remaining_unmatched=".count($unmatched)." elapsed={$dt}s\n";
    }
    $page++;
} while ($page <= $lastPage && !empty($unmatched));
fclose($fh);
$dt = round(microtime(true)-$t0,0);
echo "DONE pages=$pages seen=$seen matched=$matched still_unmatched=".count($unmatched)." elapsed={$dt}s\n";
echo "out=$out\n";
// quick breakdown of matched NIM lengths
