<?php
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

// 1) Create the 1 failed record WITHOUT email (email collision)
$lines = file(storage_path('app/legacy_master_matches.jsonl'), FILE_IGNORE_NEW_LINES);
$fixNim = '2017402108';
foreach ($lines as $ln) {
    $r = json_decode($ln, true);
    if (($r['nim'] ?? null) !== $fixNim) continue;
    if (Mahasiswa::where('nim',$fixNim)->exists()) { echo "already_exists $fixNim\n"; break; }
    DB::transaction(function () use ($r, $fixNim, $fakMap, $prodiMap, $norm) {
        $facId = ($c=$norm($r['fakultas_id']??null)) ? ($fakMap[$c]??null) : null;
        $proId = ($c=$norm($r['prodi_id']??null)) ? ($prodiMap[$c]??null) : null;
        $pw = PasswordHelper::fromBirthDate($r['tanggal_lahir']??null) ?? PasswordHelper::generateSecureDefault();
        $user = User::firstOrCreate(['username'=>$fixNim], [
            'name'=>$r['nama']??'Unknown','email'=>null,
            'password'=>Hash::make($pw),'is_active'=>true,'must_change_password'=>true,
        ]);
        if (!$user->hasRole('student')) $user->assignRole('student');
        Mahasiswa::create([
            'user_id'=>$user->id,'nim'=>$fixNim,'nama'=>$r['nama']??'Unknown',
            'nik'=>MasterDataSanitizer::nik($r['nik']??null,$fixNim),
            'mother_name'=>$r['nama_ibu']??null,'fakultas_id'=>$facId,'prodi_id'=>$proId,
            'batch_year'=>(int)($r['angkatan']??date('Y')),'gender'=>$r['jenis_kelamin']??'L',
            'birth_date'=>$r['tanggal_lahir']??null,'sks_completed'=>(int)($r['sks_completed']??0),
            'gpa'=>MasterDataSanitizer::gpa($r['gpa']??null,$fixNim),
            'status_bta_ppi'=>$r['status_bta_ppi']??'BELUM_LULUS','is_paid_ukt'=>(bool)($r['is_paid_ukt']??false),
            'master_id'=>$norm($r['id']??null),'master_synced_at'=>now(),
            'origin_type'=>'internal','is_eligible'=>false,
        ]);
    });
    echo "created_no_email $fixNim\n";
    break;
}

// 2) RELINK legacy tables by exact nim → mahasiswa.id / user_id
$relinkCompleted = DB::statement("
    UPDATE legacy_kkn_completed_students l
    SET mahasiswa_id = m.id, user_id = m.user_id, updated_at = now()
    FROM mahasiswa m
    WHERE l.mahasiswa_id IS NULL AND m.nim = l.nim
");
$relinkImports = DB::statement("
    UPDATE legacy_nilai_kkn_imports l
    SET mahasiswa_id = m.id, user_id = m.user_id, updated_at = now()
    FROM mahasiswa m
    WHERE l.mahasiswa_id IS NULL AND m.nim = l.nim
");

echo "relink done\n";
echo "completed_matched=".DB::table('legacy_kkn_completed_students')->whereNotNull('mahasiswa_id')->count()."\n";
echo "completed_unmatched=".DB::table('legacy_kkn_completed_students')->whereNull('mahasiswa_id')->count()."\n";
echo "imports_matched=".DB::table('legacy_nilai_kkn_imports')->whereNotNull('mahasiswa_id')->count()."\n";
echo "imports_unmatched=".DB::table('legacy_nilai_kkn_imports')->whereNull('mahasiswa_id')->count()."\n";
