<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$o = [];
$o[] = "=== SYNC AUDIT " . now() . " ===";
$o[] = "";

// Counts
$o[] = "RECORD COUNTS:";
$o[] = "  Fakultas:  " . DB::table('fakultas')->whereNull('deleted_at')->count();
$o[] = "  Prodi:     " . DB::table('prodi')->whereNull('deleted_at')->count();
$o[] = "  Dosen:     " . DB::table('dosen')->whereNull('deleted_at')->count();
$o[] = "  Mahasiswa: " . DB::table('mahasiswa')->whereNull('deleted_at')->count();
$o[] = "  Users:     " . DB::table('users')->count();
$o[] = "";

// Fakultas detail
$o[] = "FAKULTAS DETAIL:";
foreach(DB::table('fakultas')->whereNull('deleted_at')->orderBy('id')->get() as $f) {
    $o[] = "  ID={$f->id} | master_id={$f->master_id} | code={$f->code} | {$f->nama}";
}
$o[] = "";

// Orphan check
$orphanMhs = DB::select("
    SELECT m.fakultas_id, COUNT(*) as cnt
    FROM mahasiswa m
    LEFT JOIN fakultas f ON f.id = m.fakultas_id
    WHERE f.id IS NULL AND m.deleted_at IS NULL
    GROUP BY m.fakultas_id
");
$o[] = "FK INTEGRITY CHECK (mahasiswa → fakultas):";
if (empty($orphanMhs)) {
    $o[] = "  ✅ No orphan mahasiswa records - all FK references valid";
} else {
    foreach($orphanMhs as $r) {
        $o[] = "  ❌ fakultas_id={$r->fakultas_id} → {$r->cnt} orphan records";
    }
}
$o[] = "";

// Mahasiswa per fakultas
$o[] = "MAHASISWA PER FAKULTAS:";
$perFak = DB::select("
    SELECT f.nama, COUNT(m.id) as cnt
    FROM fakultas f
    LEFT JOIN mahasiswa m ON m.fakultas_id = f.id AND m.deleted_at IS NULL
    WHERE f.deleted_at IS NULL
    GROUP BY f.id, f.nama
    ORDER BY cnt DESC
");
foreach($perFak as $r) {
    $o[] = "  {$r->nama}: {$r->cnt}";
}
$o[] = "";

// Latest sync timestamp
$latest = DB::table('mahasiswa')->whereNull('deleted_at')->max('master_synced_at');
$o[] = "LATEST SYNC TIMESTAMP: " . ($latest ?? 'none');

file_put_contents(__DIR__.'/sync_audit_result.txt', implode("\n", $o) . "\n");
