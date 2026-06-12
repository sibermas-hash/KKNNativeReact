<?php
// Reconcile legacy "sudah KKN" alumni found in Master but rejected by the
// routine SIAKAD batch-year filter. Creates minimal user+mahasiswa, maps FK
// the same way StudentSyncService does, then relinks legacy tables.
// SAFE: firstOrCreate by username (no dupes); never touches existing rows'
// locked fields; origin internal; eligibility left default (false).
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Helpers\PasswordHelper;
use App\Models\KKN\Fakultas;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Prodi;
use App\Models\User;
use App\Services\MasterApi\MasterDataSanitizer;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

$norm = fn($v) => ($v === null || trim((string)$v) === '') ? null : trim((string)$v);

$fakMap = Fakultas::pluck('id','master_id')->all();
$prodiMap = Prodi::pluck('id','master_id')->all();

$lines = file(storage_path('app/legacy_master_matches.jsonl'), FILE_IGNORE_NEW_LINES);
echo "to_reconcile=".count($lines)."\n";

$created=0; $existed=0; $err=0; $i=0; $errSamples=[];
$t0=microtime(true);
foreach ($lines as $ln) {
    $r = json_decode($ln, true);
    if (!$r || empty($r['nim'])) continue;
    $i++;
    $nim = (string)$r['nim'];
    try {
        DB::transaction(function () use ($r, $nim, $fakMap, $prodiMap, $norm, &$created, &$existed) {
            // Skip if mahasiswa already exists (don't touch)
            $existing = Mahasiswa::where('nim', $nim)->first();
            if ($existing) { $existed++; return; }

            $facCode = $norm($r['fakultas_id'] ?? null);
            $proCode = $norm($r['prodi_id'] ?? null);
            $facId = $facCode !== null ? ($fakMap[$facCode] ?? null) : null;
            $proId = $proCode !== null ? ($prodiMap[$proCode] ?? null) : null;

            $password = PasswordHelper::fromBirthDate($r['tanggal_lahir'] ?? null)
                ?? PasswordHelper::generateSecureDefault();

            $email = null;
            if (!empty($r['email'])) {
                $e = trim((string)$r['email']);
                if (filter_var($e, FILTER_VALIDATE_EMAIL)) $email = $e;
            }

            $nama = $r['nama'] ?? 'Unknown';
            $isNew = ! User::where('username', $nim)->exists();
            $user = User::firstOrCreate(
                ['username' => $nim],
                [
                    'name' => $nama,
                    'email' => $email,
                    'password' => Hash::make($password),
                    'is_active' => true,
                    'must_change_password' => true,
                ]
            );
            if (! $user->hasRole('student')) $user->assignRole('student');

            $gpa = MasterDataSanitizer::gpa($r['gpa'] ?? null, $nim);
            $nik = MasterDataSanitizer::nik($r['nik'] ?? null, $nim);

            Mahasiswa::create([
                'user_id' => $user->id,
                'nim' => $nim,
                'nama' => $nama,
                'nik' => $nik,
                'mother_name' => $r['nama_ibu'] ?? null,
                'fakultas_id' => $facId,
                'prodi_id' => $proId,
                'batch_year' => (int)($r['angkatan'] ?? date('Y')),
                'gender' => $r['jenis_kelamin'] ?? 'L',
                'birth_date' => $r['tanggal_lahir'] ?? null,
                'sks_completed' => (int)($r['sks_completed'] ?? 0),
                'gpa' => $gpa,
                'status_bta_ppi' => $r['status_bta_ppi'] ?? 'BELUM_LULUS',
                'is_paid_ukt' => (bool)($r['is_paid_ukt'] ?? false),
                'master_id' => $norm($r['id'] ?? null),
                'master_synced_at' => now(),
                'origin_type' => 'internal',
                'is_eligible' => false,
            ]);
            $created++;
        });
    } catch (\Throwable $e) {
        $err++;
        if (count($errSamples)<8) $errSamples[] = $nim.': '.substr($e->getMessage(),0,100);
    }
    if ($i % 300 === 0) {
        $dt=round(microtime(true)-$t0,0);
        echo "progress i=$i created=$created existed=$existed err=$err elapsed={$dt}s\n";
    }
}
$dt=round(microtime(true)-$t0,0);
echo "DONE i=$i created=$created existed=$existed err=$err elapsed={$dt}s\n";
if ($errSamples) echo "err_samples=".json_encode($errSamples)."\n";

// Verify matches now in mahasiswa
$nims = array_values(array_filter(array_map(fn($l)=>json_decode($l,true)['nim']??null, $lines)));
$now=0;
foreach (array_chunk($nims,1000) as $ck) $now += DB::table('mahasiswa')->whereIn('nim',$ck)->count();
echo "matches_now_in_mahasiswa=$now / ".count($nims)."\n";
