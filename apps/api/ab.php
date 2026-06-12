<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;

// 1) Tahun akademik untuk legacy (gunakan yang ada atau buat penampung)
$taId = DB::table('tahun_akademik')->where('year','2019/2020')->value('id');
if (!$taId) {
    $taId = DB::table('tahun_akademik')->insertGetId([
        'year'=>'2019/2020','is_active'=>false,'created_at'=>now(),'updated_at'=>now(),
    ]);
}
echo "tahun_akademik_id=$taId\n";

// 2) Periode legacy penampung (1 periode untuk semua angkatan historis 51-57)
$perId = DB::table('periode')->where('name','KKN Historis (Legacy)')->value('id');
if (!$perId) {
    $perId = DB::table('periode')->insertGetId([
        'academic_year_id'=>$taId,
        'name'=>'KKN Historis (Legacy)',
        'jenis_kkn_id'=>1, // Reguler default
        'registration_start'=>now()->subYears(3),
        'registration_end'=>now()->subYears(3),
        'start_date'=>now()->subYears(3),
        'end_date'=>now()->subYears(3),
        'is_active'=>false,
        'current_phase'=>'completed',
        'created_at'=>now(),'updated_at'=>now(),
    ]);
    echo "periode_created id=$perId\n";
} else {
    echo "periode_exists id=$perId\n";
}

// 3) Insert peserta_kkn status=completed untuk semua matched legacy yang belum punya
//    baris completed di periode legacy ini. mahasiswa_id from legacy_kkn_completed_students.
$inserted = DB::affectingStatement("
    INSERT INTO peserta_kkn
        (mahasiswa_id, periode_id, status, role, registration_date, approved_at,
         entry_scheme, notes, notification_shown, revision_count, created_at, updated_at)
    SELECT DISTINCT l.mahasiswa_id, ?::bigint, 'completed', 'Anggota', now(), now(),
         'regular',
         'Import historis KKN (legacy angkatan '||l.latest_periode_kkn||', '||coalesce(l.tahun_akademik,'-')||')',
         true, 0, now(), now()
    FROM legacy_kkn_completed_students l
    WHERE l.mahasiswa_id IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM peserta_kkn p
          WHERE p.mahasiswa_id = l.mahasiswa_id
            AND p.status = 'completed'
            AND p.deleted_at IS NULL
      )
", [$perId]);
echo "peserta_completed_inserted=$inserted\n";

// 4) Mark all matched completed legacy mahasiswa as ineligible (blocking)
$updEli = DB::affectingStatement("
    UPDATE mahasiswa m
    SET is_eligible = false,
        eligibility_issues = '[\"Sudah pernah mengikuti/lulus KKN (data historis)\"]'::jsonb,
        eligibility_computed_at = now(),
        updated_at = now()
    FROM legacy_kkn_completed_students l
    WHERE l.mahasiswa_id = m.id
      AND (m.is_eligible = true OR m.eligibility_issues IS NULL)
");
echo "mahasiswa_set_ineligible=$updEli\n";

// 5) Verify
echo "completed_total=".DB::table('peserta_kkn')->where('status','completed')->whereNull('deleted_at')->count()."\n";
$stillElig = DB::table('legacy_kkn_completed_students as l')
    ->join('mahasiswa as m','m.id','=','l.mahasiswa_id')
    ->where('m.is_eligible', true)->count();
echo "matched_legacy_still_eligible=$stillElig\n";
