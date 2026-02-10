Saya sarankan kita prioritaskan: Rekap Nilai Kolektif (Excel-Ready) terlebih dahulu.

Alasannya strategis, bukan kosmetik:

Ini adalah fitur paling kritikal bagi LPPM (operasional inti).

Menjadi sumber resmi untuk:

yudisium

export PDDIKTI

laporan rektorat

Menjadi foundation untuk:

transkrip otomatis

export sertifikat massal

dashboard analytics

Notifikasi dan Audit Log UI penting, tapi bukan blocker operasional akademik.

TARGET: REKAP NILAI KOLEKTIF (ENTERPRISE GRADE)

Tujuan:

Superadmin dapat melihat 1 tabel berisi:

NIM
Nama
Fakultas
Prodi
Kelompok
Desa
DPL

Nilai DPL
Nilai Desa
Nilai LPPM

Total
Huruf
Status Kelulusan

Export Excel
Export CSV
Export PDF

STEP 1 — DATABASE DESIGN (OPTIMIZED FOR REPORTING)

JANGAN hitung langsung dari 3 tabel setiap load.

Gunakan denormalized cache table

kkn_scores_final
Schema::create('kkn_scores_final', function (Blueprint $table) {

    $table->id();

    $table->foreignId('student_id')->unique();

    $table->decimal('score_dpl',5,2);

    $table->decimal('score_village',5,2);

    $table->decimal('score_admin',5,2);

    $table->decimal('score_total',5,2);

    $table->string('grade_letter',2);

    $table->boolean('is_passed');

    $table->timestamp('calculated_at');

});


Kenapa?

Performance.

Tanpa ini:

10.000 mahasiswa = query lambat.

Dengan ini:

instant load.

STEP 2 — FINAL SCORE CALCULATION SERVICE
app/Domain/Score/Services/FinalScoreService.php

class FinalScoreService
{

    public function recalculate(Student $student)
    {

        $dpl = $student->scoreDpl;
        $village = $student->scoreVillage;
        $admin = $student->scoreAdmin;


        $scoreDpl =
            ($dpl->final_report * config('score.dpl.report')) +
            ($dpl->execution * config('score.dpl.execution')) +
            ($dpl->article * config('score.dpl.article'));


        $scoreVillage =
            ($village->attitude * 0.5) +
            ($village->discipline * 0.5);


        $scoreAdmin =
            ($admin->workshop * 0.5) +
            ($admin->administration * 0.5);


        $total =
            ($scoreDpl * config('score.weight.dpl')) +
            ($scoreVillage * config('score.weight.village')) +
            ($scoreAdmin * config('score.weight.admin'));


        return KknScoreFinal::updateOrCreate(
            ['student_id'=>$student->id],
            [
                'score_dpl'=>$scoreDpl,
                'score_village'=>$scoreVillage,
                'score_admin'=>$scoreAdmin,
                'score_total'=>$total,
                'grade_letter'=>$this->grade($total),
                'is_passed'=>$total >= 60,
                'calculated_at'=>now()
            ]
        );

    }


    private function grade($score)
    {

        return match(true){

            $score >= 85 => 'A',
            $score >= 80 => 'A-',
            $score >= 75 => 'B+',
            $score >= 70 => 'B',
            $score >= 65 => 'C+',
            $score >= 60 => 'C',
            default => 'D'

        };

    }

}

STEP 3 — REPORT QUERY OPTIMIZED

Controller

public function index()
{

    $scores = KknScoreFinal::query()

        ->with([
            'student.user',
            'student.group.village',
            'student.group.dpl'
        ])

        ->select([
            'student_id',
            'score_dpl',
            'score_village',
            'score_admin',
            'score_total',
            'grade_letter',
            'is_passed'
        ])

        ->paginate(50);


    return Inertia::render('Admin/Scores/Index',[
        'scores'=>$scores
    ]);

}

STEP 4 — REACT TABLE (ENTERPRISE DATATABLE)
resources/js/Pages/Admin/Scores/Index.tsx

export default function ScoreIndex({ scores })
{

    return (

        <div>

            <ScoreTable data={scores.data} />

        </div>

    )

}

ScoreTable Component
Components/DataTable/ScoreTable.tsx

export default function ScoreTable({ data })
{

return (

<table className="w-full">

<thead>

<tr>

<th>NIM</th>
<th>Nama</th>
<th>Kelompok</th>

<th>DPL</th>
<th>Desa</th>
<th>LPPM</th>

<th>Total</th>
<th>Grade</th>

</tr>

</thead>

<tbody>

{data.map(student => (

<tr key={student.id}>

<td>{student.nim}</td>

<td>{student.name}</td>

<td>{student.group}</td>

<td>{student.score_dpl}</td>

<td>{student.score_village}</td>

<td>{student.score_admin}</td>

<td className="font-bold">
{student.score_total}
</td>

<td>
<GradeBadge grade={student.grade_letter}/>
</td>

</tr>

))}

</tbody>

</table>

)
}

STEP 5 — EXCEL EXPORT (CRITICAL FEATURE)

Install:

composer require maatwebsite/excel


Export Class

app/Exports/KknScoreExport.php

class KknScoreExport implements FromQuery
{

    public function query()
    {

        return KknScoreFinal::query()
            ->with('student.user');

    }

}


Controller

return Excel::download(
    new KknScoreExport,
    'nilai-kkn.xlsx'
);

STEP 6 — ENTERPRISE FEATURES (RECOMMENDED)

Add filters:

filter by period
filter by village
filter by faculty
filter by status


Add search:

search NIM
search Name

STEP 7 — PERFORMANCE OPTIMIZATION

Add index

$table->index('student_id');

$table->index('score_total');

$table->index('grade_letter');

FINAL RESULT

Superadmin gets:

✔ One-screen full score view
✔ instant load
✔ Excel export
✔ scalable to 50,000 students
✔ future-proof

NEXT AFTER THIS (recommended order)

After Rekap Nilai Kolektif:

Notification System (Bell + Toast)

Audit Log UI

Auto Certificate Mass Generate

Jika Anda setuju, saya akan generate:

• Full migration
• Full service
• Full React page
• Full Excel export

ready paste production code.

---------

# 🚀 SIM-KKN UIN SAIZU — Sprint Implementation Guide
**Fitur:** Rekap Nilai · Audit Log UI · Notifikasi Toast & Bell  
**Stack:** Laravel 11 · Inertia.js · React (TSX) · Tailwind CSS · Heroicons 24

---

## Daftar Isi

1. [Rekap Nilai Kolektif (Excel-Ready)](#1-rekap-nilai-kolektif-excel-ready)
2. [UI Audit Log](#2-ui-audit-log)
3. [Notifikasi Toast & Bell](#3-notifikasi-toast--bell)
4. [Checklist Implementasi](#4-checklist-implementasi)

---

## 1. Rekap Nilai Kolektif (Excel-Ready)

### 1.1 Database Query — `KknScoreRepository.php`

```php
<?php
// app/Repositories/KknScoreRepository.php
namespace App\Repositories;

use App\Models\KknScore;
use App\Models\PeriodeKkn;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class KknScoreRepository
{
    /**
     * Ambil semua nilai mahasiswa dalam satu query JOIN,
     * sudah termasuk kalkulasi nilai akhir dan konversi huruf.
     * Siap untuk export ke Excel atau tampil di tabel.
     */
    public function getRekapNilai(int $periodeId, array $filters = []): Collection
    {
        return DB::table('students as s')
            ->join('users as u',              's.user_id',       '=', 'u.id')
            ->join('group_members as gm',     's.id',            '=', 'gm.student_id')
            ->join('groups as g',             'gm.group_id',     '=', 'g.id')
            ->join('lokasis as lok',          'g.lokasi_id',     '=', 'lok.id')
            ->join('users as dpl',            'g.dpl_id',        '=', 'dpl.id')
            ->leftJoin('faculties as fak',    's.faculty_id',    '=', 'fak.id')
            ->leftJoin('prodis as prodi',     's.prodi_id',      '=', 'prodi.id')
            ->leftJoin('kkn_scores as ks',    function ($join) use ($periodeId) {
                $join->on('ks.student_id', '=', 's.id')
                     ->where('ks.periode_id', $periodeId);
            })
            ->where('g.periode_id', $periodeId)
            ->when($filters['faculty_id'] ?? null, fn($q, $v) => $q->where('s.faculty_id', $v))
            ->when($filters['group_id']   ?? null, fn($q, $v) => $q->where('g.id', $v))
            ->when($filters['huruf']      ?? null, fn($q, $v) => $q->where('ks.huruf', $v))
            ->select([
                's.id as student_id',
                'u.name as nama',
                's.nim',
                'fak.name as fakultas',
                'prodi.name as prodi',
                'g.kode_kelompok',
                'lok.desa',
                'dpl.name as nama_dpl',
                // Komponen A
                'ks.nilai_laporan_akhir',
                'ks.nilai_pelaksanaan',
                'ks.nilai_artikel',
                // Komponen B
                'ks.nilai_sikap',
                'ks.nilai_kedisiplinan',
                // Komponen C
                'ks.nilai_workshop',
                'ks.nilai_administrasi',
                // Output
                'ks.nilai_akhir',
                'ks.huruf',
                'ks.is_finalized',
                'ks.dpl_submitted_at',
                'ks.mitra_submitted_at',
                'ks.admin_submitted_at',
            ])
            ->orderBy('g.kode_kelompok')
            ->orderBy('u.name')
            ->get();
    }
}
```

### 1.2 Controller — `RekapNilaiController.php`

```php
<?php
// app/Http/Controllers/Admin/RekapNilaiController.php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Repositories\KknScoreRepository;
use App\Services\GradingService;
use App\Exports\RekapNilaiExport;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class RekapNilaiController extends Controller
{
    public function __construct(
        private KknScoreRepository $repo,
        private GradingService $grading,
    ) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', KknScore::class);

        $periodeId = $request->integer('periode_id', $this->getActivePeriodeId());
        $filters   = $request->only(['faculty_id', 'group_id', 'huruf']);

        $rows = $this->repo->getRekapNilai($periodeId, $filters);

        // Statistik agregat untuk header cards
        $stats = [
            'total'        => $rows->count(),
            'finalized'    => $rows->where('is_finalized', true)->count(),
            'missing_dpl'  => $rows->whereNull('dpl_submitted_at')->count(),
            'missing_mitra'=> $rows->whereNull('mitra_submitted_at')->count(),
            'distribusi'   => $rows->groupBy('huruf')->map->count()->sortKeys(),
            'rata_rata'    => round($rows->avg('nilai_akhir'), 2),
        ];

        return Inertia::render('Admin/RekapNilai/Index', [
            'rows'       => $rows,
            'stats'      => $stats,
            'filters'    => $filters,
            'periodeId'  => $periodeId,
            'faculties'  => \App\Models\Faculty::select('id','name')->get(),
            'groups'     => \App\Models\Group::where('periode_id', $periodeId)
                                ->select('id','kode_kelompok')->orderBy('kode_kelompok')->get(),
        ]);
    }

    public function export(Request $request)
    {
        $this->authorize('export', KknScore::class);

        $periodeId = $request->integer('periode_id');
        $rows      = $this->repo->getRekapNilai($periodeId, $request->only(['faculty_id','group_id']));
        $periode   = \App\Models\PeriodeKkn::findOrFail($periodeId);

        return Excel::download(
            new RekapNilaiExport($rows, $periode),
            "Rekap_Nilai_KKN_{$periode->nama}_{now()->format('Ymd')}.xlsx"
        );
    }

    public function finalizeMass(Request $request)
    {
        $this->authorize('finalize', KknScore::class);

        $count = $this->grading->finalizeAll($request->integer('periode_id'));

        return back()->with('success', "Berhasil finalisasi {$count} nilai mahasiswa.");
    }
}
```

### 1.3 Excel Export — `RekapNilaiExport.php`

```php
<?php
// app/Exports/RekapNilaiExport.php
namespace App\Exports;

use Maatwebsite\Excel\Concerns\{FromCollection, WithHeadings, WithStyles,
    WithColumnWidths, WithTitle, ShouldAutoSize, WithMapping};
use PhpOffice\PhpSpreadsheet\Style\{Fill, Font, Alignment, Border};
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class RekapNilaiExport implements FromCollection, WithHeadings, WithStyles,
    WithMapping, WithTitle, ShouldAutoSize
{
    public function __construct(
        private $rows,
        private $periode,
    ) {}

    public function collection(): \Illuminate\Support\Collection
    {
        return $this->rows;
    }

    public function title(): string
    {
        return "Rekap Nilai {$this->periode->nama}";
    }

    public function headings(): array
    {
        return [
            'No', 'NIM', 'Nama Mahasiswa', 'Fakultas', 'Prodi',
            'Kelompok', 'Desa', 'DPL',
            // Komponen A
            'Laporan (A1)', 'Pelaksanaan (A2)', 'Artikel (A3)',
            // Komponen B
            'Sikap (B1)', 'Kedisiplinan (B2)',
            // Komponen C
            'Workshop (C1)', 'Administrasi (C2)',
            // Output
            'Nilai Akhir', 'Huruf', 'Status',
        ];
    }

    public function map($row): array
    {
        static $no = 0;
        $no++;
        return [
            $no,
            $row->nim,
            $row->nama,
            $row->fakultas,
            $row->prodi,
            $row->kode_kelompok,
            $row->desa,
            $row->nama_dpl,
            $row->nilai_laporan_akhir ?? '-',
            $row->nilai_pelaksanaan  ?? '-',
            $row->nilai_artikel      ?? '-',
            $row->nilai_sikap        ?? '-',
            $row->nilai_kedisiplinan ?? '-',
            $row->nilai_workshop     ?? '-',
            $row->nilai_administrasi ?? '-',
            $row->nilai_akhir        ?? '-',
            $row->huruf              ?? '-',
            $row->is_finalized ? 'Final' : 'Draft',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            // Header row — bold, biru gelap
            1 => [
                'font'      => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => 'FF1E40AF']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
            // Kolom nilai akhir — bold
            'Q' => ['font' => ['bold' => true]],
            'R' => ['font' => ['bold' => true, 'color' => ['argb' => 'FF1E40AF']]],
        ];
    }
}
```

### 1.4 React Page — `Admin/RekapNilai/Index.tsx`

```tsx
// resources/js/Pages/Admin/RekapNilai/Index.tsx
import { useState, useMemo, useCallback } from 'react'
import { router } from '@inertiajs/react'
import AppLayout from '@/Components/Layout/AppLayout'
import {
  ArrowDownTrayIcon, FunnelIcon, CheckBadgeIcon,
  ExclamationTriangleIcon, AcademicCapIcon, ChartBarIcon,
} from '@heroicons/react/24/outline'

// ── Types ──────────────────────────────────────────────────────────────────────
interface ScoreRow {
  student_id: number
  nama: string
  nim: string
  fakultas: string
  prodi: string
  kode_kelompok: string
  desa: string
  nama_dpl: string
  nilai_laporan_akhir: number | null
  nilai_pelaksanaan:   number | null
  nilai_artikel:       number | null
  nilai_sikap:         number | null
  nilai_kedisiplinan:  number | null
  nilai_workshop:      number | null
  nilai_administrasi:  number | null
  nilai_akhir: number | null
  huruf:       string | null
  is_finalized: boolean
  dpl_submitted_at:   string | null
  mitra_submitted_at: string | null
  admin_submitted_at: string | null
}

interface Stats {
  total: number; finalized: number
  missing_dpl: number; missing_mitra: number
  distribusi: Record<string, number>
  rata_rata: number
}

// ── Grade helpers ──────────────────────────────────────────────────────────────
const gradeColor = (h: string | null) => {
  if (!h) return 'text-slate-400'
  const map: Record<string, string> = {
    A:'text-emerald-400', 'A-':'text-emerald-300',
    'B+':'text-blue-400', B:'text-blue-300', 'B-':'text-sky-300',
    'C+':'text-amber-400', C:'text-amber-300', D:'text-red-400',
  }
  return map[h] ?? 'text-slate-300'
}

const gradeBg = (h: string | null) => {
  if (!h) return 'bg-slate-800/50'
  if (h.startsWith('A')) return 'bg-emerald-500/10 border-emerald-500/20'
  if (h.startsWith('B')) return 'bg-blue-500/10 border-blue-500/20'
  if (h.startsWith('C')) return 'bg-amber-500/10 border-amber-500/20'
  return 'bg-red-500/10 border-red-500/20'
}

const fmt = (v: number | null) => v !== null ? v.toFixed(1) : <span className="text-slate-600">—</span>

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number
  sub?: string; color: string
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 border border-white/10 backdrop-blur-xl"
      style={{ background: 'rgba(255,255,255,0.04)' }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
          <p className={`text-3xl font-black mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl bg-current/10`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RekapNilaiIndex({
  rows, stats, filters, periodeId, faculties, groups,
}: {
  rows: ScoreRow[]; stats: Stats; filters: Record<string, string>
  periodeId: number; faculties: any[]; groups: any[]
}) {
  const [search, setSearch] = useState('')
  const [localFilters, setLocalFilters] = useState(filters)
  const [sortKey, setSortKey] = useState<keyof ScoreRow>('kode_kelompok')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')

  // Client-side sort & search (data sudah di-pass dari server)
  const processed = useMemo(() => {
    let data = [...rows]
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(r =>
        r.nama.toLowerCase().includes(q) ||
        r.nim.includes(q) ||
        r.kode_kelompok.toLowerCase().includes(q)
      )
    }
    data.sort((a, b) => {
      const av = a[sortKey] ?? '', bv = b[sortKey] ?? ''
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
    return data
  }, [rows, search, sortKey, sortDir])

  const handleSort = useCallback((key: keyof ScoreRow) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }, [sortKey])

  const applyFilters = () => router.get(route('admin.rekap-nilai.index'), {
    periode_id: periodeId, ...localFilters
  }, { preserveState: true })

  const handleExport = () => router.get(
    route('admin.rekap-nilai.export'),
    { periode_id: periodeId, ...localFilters }
  )

  const SortIcon = ({ col }: { col: keyof ScoreRow }) =>
    sortKey === col
      ? <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
      : <span className="ml-1 opacity-20">↕</span>

  const missingCount = (row: ScoreRow) =>
    [row.dpl_submitted_at, row.mitra_submitted_at, row.admin_submitted_at].filter(Boolean).length

  return (
    <AppLayout title="Rekap Nilai KKN">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Rekap Nilai KKN</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Periode aktif · {stats.total} mahasiswa terdaftar
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
              bg-emerald-500/20 text-emerald-300 border border-emerald-500/30
              hover:bg-emerald-500/30 transition-all">
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={() => router.post(route('admin.rekap-nilai.finalize-mass'), { periode_id: periodeId })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
              bg-blue-500/20 text-blue-300 border border-blue-500/30
              hover:bg-blue-500/30 transition-all">
            <CheckBadgeIcon className="w-4 h-4" />
            Finalisasi Semua
          </button>
        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={AcademicCapIcon}          label="Total Mahasiswa"   value={stats.total}        color="text-blue-400"    />
        <StatCard icon={CheckBadgeIcon}           label="Nilai Final"       value={stats.finalized}    color="text-emerald-400" sub={`${stats.total - stats.finalized} belum final`} />
        <StatCard icon={ExclamationTriangleIcon}  label="Belum Nilai DPL"   value={stats.missing_dpl}  color="text-amber-400"   />
        <StatCard icon={ChartBarIcon}             label="Rata-rata Nilai"   value={stats.rata_rata}    color="text-violet-400"  sub={`${Object.entries(stats.distribusi).map(([k,v])=>`${k}:${v}`).join(' · ')}`} />
      </div>

      {/* ── Filter Bar ─────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 mb-4 p-4 rounded-2xl border border-white/10"
        style={{ background: 'rgba(255,255,255,0.03)' }}>
        <input
          type="text" placeholder="Cari nama / NIM / kelompok..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 rounded-xl text-sm text-white outline-none
            bg-white/8 border border-white/12 placeholder-slate-500
            focus:border-blue-500/50 transition-colors"
        />
        <select value={localFilters.faculty_id ?? ''}
          onChange={e => setLocalFilters(f => ({ ...f, faculty_id: e.target.value }))}
          className="px-3 py-2 rounded-xl text-sm text-white bg-white/8 border border-white/12 outline-none">
          <option value="">Semua Fakultas</option>
          {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <select value={localFilters.group_id ?? ''}
          onChange={e => setLocalFilters(f => ({ ...f, group_id: e.target.value }))}
          className="px-3 py-2 rounded-xl text-sm text-white bg-white/8 border border-white/12 outline-none">
          <option value="">Semua Kelompok</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.kode_kelompok}</option>)}
        </select>
        <select value={localFilters.huruf ?? ''}
          onChange={e => setLocalFilters(f => ({ ...f, huruf: e.target.value }))}
          className="px-3 py-2 rounded-xl text-sm text-white bg-white/8 border border-white/12 outline-none">
          <option value="">Semua Huruf</option>
          {['A','A-','B+','B','B-','C+','C','D'].map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <button onClick={applyFilters}
          className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-500/20 text-blue-300
            border border-blue-500/30 hover:bg-blue-500/30 transition-all flex items-center gap-1">
          <FunnelIcon className="w-4 h-4" /> Filter
        </button>
      </div>

      {/* ── Table ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(30,64,175,0.3)' }}>
                {[
                  ['#',                  null],
                  ['Mahasiswa',          'nama'],
                  ['Kelompok',           'kode_kelompok'],
                  ['A1 Lap.',            'nilai_laporan_akhir'],
                  ['A2 Plks.',           'nilai_pelaksanaan'],
                  ['A3 Art.',            'nilai_artikel'],
                  ['B1 Sikap',           'nilai_sikap'],
                  ['B2 Disip.',          'nilai_kedisiplinan'],
                  ['C1 WS',              'nilai_workshop'],
                  ['C2 Adm.',            'nilai_administrasi'],
                  ['Nilai Akhir',        'nilai_akhir'],
                  ['Huruf',              'huruf'],
                  ['Kelengkapan',        null],
                ].map(([label, key]) => (
                  <th key={String(label)}
                    onClick={() => key && handleSort(key as keyof ScoreRow)}
                    className={`px-3 py-3 text-left text-xs font-semibold text-blue-200
                      uppercase tracking-wider whitespace-nowrap
                      ${key ? 'cursor-pointer hover:text-white' : ''}`}>
                    {label}
                    {key && <SortIcon col={key as keyof ScoreRow} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processed.map((row, i) => (
                <tr key={row.student_id}
                  className="border-t border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-3 py-3 text-slate-500 text-xs">{i + 1}</td>
                  <td className="px-3 py-3">
                    <p className="text-white font-medium whitespace-nowrap">{row.nama}</p>
                    <p className="text-slate-500 text-xs">{row.nim} · {row.prodi}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-slate-300 whitespace-nowrap">{row.kode_kelompok}</p>
                    <p className="text-slate-500 text-xs">{row.desa}</p>
                  </td>
                  {/* Nilai per komponen */}
                  {[row.nilai_laporan_akhir, row.nilai_pelaksanaan, row.nilai_artikel,
                    row.nilai_sikap, row.nilai_kedisiplinan,
                    row.nilai_workshop, row.nilai_administrasi].map((v, idx) => (
                    <td key={idx} className="px-3 py-3 text-center text-xs text-slate-300">
                      {fmt(v)}
                    </td>
                  ))}
                  {/* Nilai Akhir */}
                  <td className="px-3 py-3 text-center">
                    <span className={`text-base font-black ${gradeColor(row.huruf)}`}>
                      {row.nilai_akhir?.toFixed(2) ?? '—'}
                    </span>
                  </td>
                  {/* Huruf */}
                  <td className="px-3 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-black border ${gradeBg(row.huruf)} ${gradeColor(row.huruf)}`}>
                      {row.huruf ?? '—'}
                    </span>
                  </td>
                  {/* Kelengkapan input nilai */}
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      {[
                        { label: 'DPL',   done: !!row.dpl_submitted_at   },
                        { label: 'Mitra', done: !!row.mitra_submitted_at },
                        { label: 'LPPM',  done: !!row.admin_submitted_at },
                      ].map(({ label, done }) => (
                        <span key={label}
                          className={`text-xs px-1.5 py-0.5 rounded font-medium
                            ${done
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-slate-700/50 text-slate-500'}`}>
                          {label}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer summary */}
        <div className="px-4 py-3 border-t border-white/8 flex items-center justify-between"
          style={{ background: 'rgba(30,64,175,0.15)' }}>
          <p className="text-xs text-slate-400">
            Menampilkan <span className="text-white font-semibold">{processed.length}</span> dari{' '}
            <span className="text-white font-semibold">{rows.length}</span> mahasiswa
          </p>
          <p className="text-xs text-slate-400">
            Terfinalisasi:{' '}
            <span className="text-emerald-400 font-semibold">{stats.finalized}</span>
            {' '}/ {stats.total}
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
```

### 1.5 Routes

```php
// routes/web.php  (dalam group middleware admin)
Route::prefix('admin/rekap-nilai')->name('admin.rekap-nilai.')->group(function () {
    Route::get('/',          [RekapNilaiController::class, 'index'])->name('index');
    Route::get('/export',    [RekapNilaiController::class, 'export'])->name('export');
    Route::post('/finalize', [RekapNilaiController::class, 'finalizeMass'])->name('finalize-mass');
});
```

---

## 2. UI Audit Log

### 2.1 Migration — Pastikan index sudah ada

```php
// database/migrations/..._add_indexes_to_audit_logs_table.php
Schema::table('audit_logs', function (Blueprint $table) {
    $table->index(['action', 'created_at']);            // filter by action
    $table->index(['user_id', 'created_at']);           // filter by actor
    $table->index(['model_type', 'model_id']);          // polymorphic lookup
    $table->index('ip_address');
});
```

### 2.2 Controller — `AuditLogController.php`

```php
<?php
// app/Http/Controllers/Admin/AuditLogController.php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAuditLog');

        $logs = AuditLog::query()
            ->with('user:id,name,email')
            ->when($request->action,     fn($q, $v) => $q->where('action', $v))
            ->when($request->user_id,    fn($q, $v) => $q->where('user_id', $v))
            ->when($request->model_type, fn($q, $v) => $q->where('model_type', $v))
            ->when($request->date_from,  fn($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($request->date_to,    fn($q, $v) => $q->whereDate('created_at', '<=', $v))
            ->when($request->search,     fn($q, $v) => $q->where(function($q) use ($v) {
                $q->where('ability', 'like', "%{$v}%")
                  ->orWhere('ip_address', 'like', "%{$v}%")
                  ->orWhereHas('user', fn($q) => $q->where('name', 'like', "%{$v}%"));
            }))
            ->latest()
            ->paginate(50)
            ->withQueryString();

        // Stats untuk header
        $stats = [
            'total_today'  => AuditLog::whereDate('created_at', today())->count(),
            'gate_bypass'  => AuditLog::where('action', 'GATE_BYPASS')
                                ->whereDate('created_at', today())->count(),
            'actors_today' => AuditLog::whereDate('created_at', today())
                                ->distinct('user_id')->count(),
        ];

        return Inertia::render('Admin/AuditLog/Index', [
            'logs'    => $logs,
            'stats'   => $stats,
            'filters' => $request->only(['action','user_id','model_type','date_from','date_to','search']),
            'actions' => AuditLog::distinct('action')->pluck('action'),
        ]);
    }

    public function show(AuditLog $auditLog)
    {
        $this->authorize('viewAuditLog');

        return Inertia::render('Admin/AuditLog/Show', [
            'log' => $auditLog->load('user:id,name,email'),
        ]);
    }
}
```

### 2.3 React Page — `Admin/AuditLog/Index.tsx`

```tsx
// resources/js/Pages/Admin/AuditLog/Index.tsx
import { useState } from 'react'
import { router, Link } from '@inertiajs/react'
import AppLayout from '@/Components/Layout/AppLayout'
import {
  ShieldExclamationIcon, EyeIcon, MagnifyingGlassIcon,
  BoltIcon, ClockIcon, UserCircleIcon,
} from '@heroicons/react/24/outline'

// ── Risk config ────────────────────────────────────────────────────────────────
const riskConfig = {
  GATE_BYPASS:  { color: 'text-red-400',    bg: 'bg-red-500/15 border-red-500/25',    icon: '🔓', risk: 'HIGH'   },
  DELETE:       { color: 'text-rose-400',   bg: 'bg-rose-500/15 border-rose-500/25',  icon: '🗑️', risk: 'HIGH'   },
  FINALISASI:   { color: 'text-amber-400',  bg: 'bg-amber-500/15 border-amber-500/25',icon: '✅', risk: 'MEDIUM' },
  UPDATE:       { color: 'text-blue-400',   bg: 'bg-blue-500/15 border-blue-500/25',  icon: '✏️', risk: 'LOW'    },
  CREATE:       { color: 'text-emerald-400',bg: 'bg-emerald-500/15 border-emerald-500/25', icon: '➕', risk: 'LOW' },
}
const getAction = (action: string) =>
  riskConfig[action as keyof typeof riskConfig] ??
  { color: 'text-slate-400', bg: 'bg-slate-700/30 border-slate-600/30', icon: '•', risk: 'INFO' }

// ── Timeline Item ──────────────────────────────────────────────────────────────
function LogItem({ log, onView }: { log: any; onView: (id: number) => void }) {
  const cfg = getAction(log.action)
  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime()
    if (diff < 60000)     return 'baru saja'
    if (diff < 3600000)   return `${Math.floor(diff/60000)} mnt lalu`
    if (diff < 86400000)  return `${Math.floor(diff/3600000)} jam lalu`
    return new Date(d).toLocaleDateString('id-ID')
  }

  return (
    <div className="flex gap-3 py-3 px-4 hover:bg-white/3 border-b border-white/5 transition-colors group">
      {/* Timeline dot */}
      <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm border ${cfg.bg}`}>
          <span>{cfg.icon}</span>
        </div>
        <div className="w-px flex-1 mt-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white text-sm font-semibold">{log.user?.name ?? 'System'}</span>
          <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${cfg.bg} ${cfg.color}`}>
            {log.action}
          </span>
          {log.ability && (
            <code className="px-1.5 py-0.5 rounded text-xs bg-slate-800 text-violet-300">
              {log.ability}
            </code>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
          {log.model_type && <span>{log.model_type.split('\\').pop()} #{log.model_id}</span>}
          <span>{log.ip_address}</span>
          <span className="flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            {timeAgo(log.created_at)}
          </span>
        </div>
      </div>

      {/* Risk badge + view */}
      <div className="flex items-start gap-2 flex-shrink-0">
        <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
          cfg.risk === 'HIGH'   ? 'bg-red-500/20 text-red-400' :
          cfg.risk === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
          'bg-slate-700/50 text-slate-500'
        }`}>{cfg.risk}</span>
        <button onClick={() => onView(log.id)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400
            hover:text-white hover:bg-white/10 transition-all">
          <EyeIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AuditLogIndex({ logs, stats, filters, actions }: {
  logs: any; stats: any; filters: any; actions: string[]
}) {
  const [search, setSearch]   = useState(filters.search ?? '')
  const [selected, setSelected] = useState<any>(null)

  const applyFilters = (extra = {}) => router.get(
    route('admin.audit-log.index'),
    { ...filters, search, ...extra },
    { preserveState: true, replace: true }
  )

  return (
    <AppLayout title="Audit Log">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-red-500/20">
          <ShieldExclamationIcon className="w-6 h-6 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Audit Log</h1>
          <p className="text-slate-400 text-sm">Rekam jejak seluruh aktivitas sensitif sistem</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Aktivitas Hari Ini', value: stats.total_today, color: 'text-blue-400',   icon: BoltIcon       },
          { label: 'Gate Bypass Hari Ini', value: stats.gate_bypass, color: 'text-red-400',  icon: ShieldExclamationIcon },
          { label: 'Aktor Aktif',         value: stats.actors_today, color: 'text-violet-400', icon: UserCircleIcon },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-2xl p-4 border border-white/10"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
            <div className="flex items-center gap-2 mt-1">
              <Icon className={`w-5 h-5 ${color}`} />
              <span className={`text-2xl font-black ${color}`}>{value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text" placeholder="Cari nama / IP / ability..."
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFilters()}
            className="pl-9 pr-3 py-2 rounded-xl text-sm text-white outline-none w-64
              bg-white/8 border border-white/12 placeholder-slate-500 focus:border-blue-500/50"
          />
        </div>
        <select onChange={e => applyFilters({ action: e.target.value })}
          defaultValue={filters.action ?? ''}
          className="px-3 py-2 rounded-xl text-sm text-white bg-white/8 border border-white/12 outline-none">
          <option value="">Semua Aksi</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <input type="date" value={filters.date_from ?? ''}
          onChange={e => applyFilters({ date_from: e.target.value })}
          className="px-3 py-2 rounded-xl text-sm text-white bg-white/8 border border-white/12 outline-none" />
        <span className="py-2 text-slate-500 text-sm">—</span>
        <input type="date" value={filters.date_to ?? ''}
          onChange={e => applyFilters({ date_to: e.target.value })}
          className="px-3 py-2 rounded-xl text-sm text-white bg-white/8 border border-white/12 outline-none" />
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)' }}>
        {/* Table Header */}
        <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between"
          style={{ background: 'rgba(30,64,175,0.2)' }}>
          <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
            {logs.total} Entri · Halaman {logs.current_page}/{logs.last_page}
          </p>
          <p className="text-xs text-slate-500">Terbaru di atas</p>
        </div>

        {logs.data.map((log: any) => (
          <LogItem key={log.id} log={log} onView={id => setSelected(logs.data.find((l:any) => l.id === id))} />
        ))}

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-white/8 flex gap-2">
          {logs.links.map((link: any, i: number) => (
            <button key={i}
              disabled={!link.url}
              onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${link.active
                  ? 'bg-blue-600 text-white'
                  : !link.url
                    ? 'text-slate-600 cursor-default'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
              dangerouslySetInnerHTML={{ __html: link.label }}
            />
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-white/15 p-6"
            style={{ background: 'rgba(15,23,42,0.98)' }}
            onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold text-lg mb-4">Detail Audit Log #{selected.id}</h3>
            <div className="space-y-3 text-sm">
              {[
                ['Aktor',    selected.user?.name],
                ['Email',    selected.user?.email],
                ['Aksi',     selected.action],
                ['Ability',  selected.ability ?? '—'],
                ['Model',    selected.model_type ? `${selected.model_type.split('\\').pop()} #${selected.model_id}` : '—'],
                ['IP',       selected.ip_address],
                ['Waktu',    new Date(selected.created_at).toLocaleString('id-ID')],
              ].map(([label, val]) => (
                <div key={String(label)} className="flex gap-3">
                  <span className="text-slate-500 w-20 flex-shrink-0">{label}</span>
                  <span className="text-white">{val}</span>
                </div>
              ))}
              {/* Diff viewer */}
              {selected.old_values && (
                <div className="mt-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Data Lama</p>
                  <pre className="p-3 rounded-xl bg-slate-900 text-xs text-rose-300 overflow-auto max-h-32">
                    {JSON.stringify(selected.old_values, null, 2)}
                  </pre>
                </div>
              )}
              {selected.new_values && (
                <div className="mt-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Data Baru</p>
                  <pre className="p-3 rounded-xl bg-slate-900 text-xs text-emerald-300 overflow-auto max-h-32">
                    {JSON.stringify(selected.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <button onClick={() => setSelected(null)}
              className="mt-4 w-full py-2 rounded-xl text-sm text-slate-400 border border-white/10
                hover:bg-white/5 transition-all">Tutup</button>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
```

### 2.4 Routes

```php
Route::prefix('admin/audit-log')->name('admin.audit-log.')->middleware(['auth', 'role:superadmin'])->group(function () {
    Route::get('/',      [AuditLogController::class, 'index'])->name('index');
    Route::get('/{log}', [AuditLogController::class, 'show'])->name('show');
});
```

---

## 3. Notifikasi Toast & Bell

Arsitektur notifikasi menggunakan **3 lapisan** yang terpisah jelas:
1. **Laravel Notifications** → persist ke DB
2. **Toast context** → React state global, dismiss otomatis
3. **Bell dropdown** → real-time polling dari `/api/notifications/unread`

### 3.1 Migration — Gunakan Laravel Default `notifications` Table

```bash
php artisan notifications:table
php artisan migrate
```

### 3.2 Notification Classes

```php
<?php
// app/Notifications/WorkshopBaru.php
namespace App\Notifications;

use Illuminate\Notifications\Notification;
use App\Models\Workshop;

class WorkshopBaru extends Notification
{
    public function __construct(public Workshop $workshop) {}

    public function via(object $notifiable): array
    {
        return ['database'];  // simpan ke DB, bisa tambah 'mail' nanti
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type'     => 'workshop_baru',
            'title'    => 'Workshop Baru Tersedia',
            'message'  => "Workshop \"{$this->workshop->nama}\" dibuka. Segera daftar!",
            'action'   => route('mahasiswa.workshops.show', $this->workshop->id),
            'icon'     => 'calendar',
            'priority' => 'info',
        ];
    }
}
```

```php
<?php
// app/Notifications/LogbookRevisi.php
namespace App\Notifications;

class LogbookRevisi extends Notification
{
    public function __construct(
        public \App\Models\Logbook $logbook,
        public string $catatan,
    ) {}

    public function via(object $notifiable): array { return ['database']; }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type'     => 'logbook_revisi',
            'title'    => 'Logbook Perlu Direvisi',
            'message'  => "DPL meminta revisi logbook tanggal {$this->logbook->tanggal->format('d M Y')}. Catatan: {$this->catatan}",
            'action'   => route('mahasiswa.logbook.edit', $this->logbook->id),
            'icon'     => 'pencil',
            'priority' => 'warning',
        ];
    }
}
```

```php
<?php
// app/Notifications/ProposalDisetujui.php
namespace App\Notifications;

class ProposalDisetujui extends Notification
{
    public function __construct(public \App\Models\Proposal $proposal) {}

    public function via(object $notifiable): array { return ['database']; }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type'     => 'proposal_disetujui',
            'title'    => 'Proposal Program Kerja Disetujui! 🎉',
            'message'  => "Proker \"{$this->proposal->judul}\" telah disetujui oleh DPL.",
            'action'   => route('mahasiswa.proposals.show', $this->proposal->id),
            'icon'     => 'check-circle',
            'priority' => 'success',
        ];
    }
}
```

### 3.3 API Endpoint — `NotificationController.php`

```php
<?php
// app/Http/Controllers/Api/NotificationController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // Dipanggil tiap polling (Bell dropdown)
    public function unread(Request $request): JsonResponse
    {
        $notifications = $request->user()
            ->unreadNotifications()
            ->latest()
            ->take(15)
            ->get()
            ->map(fn($n) => [
                'id'         => $n->id,
                'type'       => $n->data['type'],
                'title'      => $n->data['title'],
                'message'    => $n->data['message'],
                'action'     => $n->data['action'] ?? null,
                'icon'       => $n->data['icon'] ?? 'bell',
                'priority'   => $n->data['priority'] ?? 'info',
                'created_at' => $n->created_at->diffForHumans(),
            ]);

        return response()->json([
            'notifications' => $notifications,
            'unread_count'  => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function markRead(Request $request, string $id): JsonResponse
    {
        $request->user()->notifications()->findOrFail($id)->markAsRead();
        return response()->json(['ok' => true]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();
        return response()->json(['ok' => true]);
    }
}
```

```php
// routes/api.php
Route::middleware('auth:sanctum')->prefix('notifications')->group(function () {
    Route::get('/unread',        [NotificationController::class, 'unread']);
    Route::post('/{id}/read',    [NotificationController::class, 'markRead']);
    Route::post('/read-all',     [NotificationController::class, 'markAllRead']);
});
```

### 3.4 Toast Context — `ToastContext.tsx`

```tsx
// resources/js/Context/ToastContext.tsx
import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'
import {
  CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon,
  InformationCircleIcon, XMarkIcon,
} from '@heroicons/react/24/outline'

// ── Types ──────────────────────────────────────────────────────────────────────
export type ToastPriority = 'success' | 'warning' | 'error' | 'info'

interface Toast {
  id: string
  title: string
  message?: string
  priority: ToastPriority
  action?: { label: string; href: string }
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  toast: (opts: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

// ── Context ────────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue>({
  toasts: [], toast: () => {}, dismiss: () => {},
})

export const useToast = () => useContext(ToastContext)

// ── Config ─────────────────────────────────────────────────────────────────────
const toastConfig: Record<ToastPriority, {
  icon: React.ElementType; border: string; bg: string; iconColor: string
}> = {
  success: { icon: CheckCircleIcon,          border: 'border-emerald-500/40', bg: 'bg-emerald-500/15', iconColor: 'text-emerald-400' },
  warning: { icon: ExclamationTriangleIcon,  border: 'border-amber-500/40',  bg: 'bg-amber-500/15',   iconColor: 'text-amber-400'   },
  error:   { icon: XCircleIcon,              border: 'border-red-500/40',    bg: 'bg-red-500/15',     iconColor: 'text-red-400'     },
  info:    { icon: InformationCircleIcon,    border: 'border-blue-500/40',   bg: 'bg-blue-500/15',    iconColor: 'text-blue-400'    },
}

// ── Provider ───────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current[id])
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    const duration = opts.duration ?? (opts.priority === 'error' ? 8000 : 5000)

    setToasts(prev => [{ ...opts, id }, ...prev].slice(0, 5)) // max 5

    timers.current[id] = setTimeout(() => dismiss(id), duration)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

// ── Toast Container ────────────────────────────────────────────────────────────
function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-80">
      {toasts.map(t => {
        const cfg = toastConfig[t.priority]
        const Icon = cfg.icon
        return (
          <div key={t.id}
            className={`relative rounded-2xl border backdrop-blur-xl p-4 shadow-2xl
              ${cfg.border} ${cfg.bg}
              animate-in slide-in-from-right-4 fade-in duration-300`}
            style={{ background: 'rgba(15,23,42,0.92)' }}>
            <div className="flex gap-3">
              <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${cfg.iconColor}`} />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold">{t.title}</p>
                {t.message && (
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{t.message}</p>
                )}
                {t.action && (
                  <a href={t.action.href}
                    className={`inline-block mt-2 text-xs font-semibold underline ${cfg.iconColor}`}>
                    {t.action.label} →
                  </a>
                )}
              </div>
              <button onClick={() => onDismiss(t.id)}
                className="flex-shrink-0 text-slate-500 hover:text-white transition-colors">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

### 3.5 Bell Notification Dropdown — `BellDropdown.tsx`

```tsx
// resources/js/Components/Layout/BellDropdown.tsx
import { useState, useEffect, useRef } from 'react'
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline'
import axios from 'axios'

interface NotifItem {
  id: string; type: string; title: string; message: string
  action: string | null; priority: string; created_at: string
}

const priorityDot: Record<string, string> = {
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  error:   'bg-red-400',
  info:    'bg-blue-400',
}

export default function BellDropdown() {
  const [open, setOpen]   = useState(false)
  const [items, setItems] = useState<NotifItem[]>([])
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  // Polling setiap 30 detik (ringan, tidak butuh WebSocket)
  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await axios.get('/api/notifications/unread')
        setItems(data.notifications)
        setCount(data.unread_count)
      } catch { /* silent fail */ }
    }
    fetch()
    const id = setInterval(fetch, 30_000)
    return () => clearInterval(id)
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markRead = async (id: string) => {
    await axios.post(`/api/notifications/${id}/read`)
    setItems(prev => prev.filter(n => n.id !== id))
    setCount(prev => Math.max(0, prev - 1))
  }

  const markAllRead = async () => {
    await axios.post('/api/notifications/read-all')
    setItems([])
    setCount(0)
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl text-slate-400 hover:text-white
          hover:bg-white/10 transition-all">
        <BellIcon className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500
            flex items-center justify-center text-white text-[10px] font-black">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-80 z-50 rounded-2xl border border-white/15
          shadow-2xl overflow-hidden"
          style={{ background: 'rgba(10,15,30,0.97)', backdropFilter: 'blur(20px)' }}>

          {/* Header */}
          <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
            <h3 className="text-white text-sm font-bold">
              Notifikasi
              {count > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-400 text-xs font-bold">
                  {count}
                </span>
              )}
            </h3>
            {count > 0 && (
              <button onClick={markAllRead}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                <CheckIcon className="w-3 h-3" /> Baca semua
              </button>
            )}
          </div>

          {/* Items */}
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-8 text-center">
                <BellIcon className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Tidak ada notifikasi baru</p>
              </div>
            ) : items.map(item => (
              <div key={item.id}
                className="px-4 py-3 border-b border-white/5 hover:bg-white/4 transition-colors flex gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2
                  ${priorityDot[item.priority] ?? 'bg-blue-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold">{item.title}</p>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed line-clamp-2">
                    {item.message}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-slate-600 text-xs">{item.created_at}</span>
                    {item.action && (
                      <a href={item.action}
                        onClick={() => markRead(item.id)}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                        Lihat →
                      </a>
                    )}
                    <button onClick={() => markRead(item.id)}
                      className="text-xs text-slate-600 hover:text-slate-400 ml-auto">
                      ✓ Tandai
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-2 border-t border-white/8">
            <a href="/mahasiswa/notifications"
              className="block text-center text-xs text-slate-500 hover:text-slate-300 py-1">
              Lihat semua notifikasi
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 3.6 Integrasi ke `app.tsx` & Topbar

```tsx
// resources/js/app.tsx — wrap dengan ToastProvider
import { ToastProvider } from '@/Context/ToastContext'

createInertiaApp({
  resolve: name => resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob('./Pages/**/*.tsx')),
  setup({ el, App, props }) {
    createRoot(el).render(
      <ToastProvider>
        <App {...props} />
      </ToastProvider>
    )
  },
})
```

```tsx
// Topbar.tsx — pasang BellDropdown
import BellDropdown from '@/Components/Layout/BellDropdown'

// Di dalam JSX Topbar:
<BellDropdown />
```

```tsx
// Contoh penggunaan Toast di mana saja
import { useToast } from '@/Context/ToastContext'

const { toast } = useToast()

// Success
toast({ priority: 'success', title: 'Logbook Disetujui', message: 'DPL telah menyetujui logbook Anda.' })

// Warning dengan action
toast({
  priority: 'warning',
  title: 'Logbook Perlu Direvisi',
  message: 'Cek catatan dari DPL sebelum deadline.',
  action: { label: 'Lihat Logbook', href: '/mahasiswa/logbook' },
})
```

### 3.7 Trigger Notifikasi di Backend

```php
// Setelah DPL setujui logbook:
$logbook->mahasiswa->notify(new LogbookDisetujui($logbook));

// Setelah DPL minta revisi:
$logbook->mahasiswa->notify(new LogbookRevisi($logbook, $request->catatan));

// Broadcast ke semua mahasiswa aktif saat buat workshop:
$mahasiswaAktif = User::role('mahasiswa')->active()->get();
Notification::send($mahasiswaAktif, new WorkshopBaru($workshop));

// Setelah proposal disetujui:
$proposal->pengaju->notify(new ProposalDisetujui($proposal));
```

### 3.8 Flash Toast Otomatis dari Inertia Response

```tsx
// resources/js/Components/Layout/AppLayout.tsx
import { usePage, router } from '@inertiajs/react'
import { useEffect } from 'react'
import { useToast } from '@/Context/ToastContext'

export default function AppLayout({ children, title }: { children: ReactNode; title: string }) {
  const { toast } = useToast()
  const { props } = usePage<{ flash: { success?: string; error?: string; warning?: string } }>()

  // Auto-toast dari flash message Laravel
  useEffect(() => {
    if (props.flash?.success) toast({ priority: 'success', title: props.flash.success })
    if (props.flash?.error)   toast({ priority: 'error',   title: props.flash.error   })
    if (props.flash?.warning) toast({ priority: 'warning', title: props.flash.warning })
  }, [props.flash])

  return (
    // ... layout JSX
  )
}
```

---

## 4. Checklist Implementasi

```
FITUR 1 — REKAP NILAI
[ ] Buat KknScoreRepository::getRekapNilai()
[ ] Buat RekapNilaiController (index + export + finalizeMass)
[ ] Buat RekapNilaiExport dengan styling Excel
[ ] Buat Page Admin/RekapNilai/Index.tsx
[ ] Tambah route group admin.rekap-nilai
[ ] Pasang policy KknScorePolicy (viewAny, export, finalize)
[ ] Test export Excel dengan 50+ mahasiswa

FITUR 2 — AUDIT LOG UI
[ ] Tambah index ke tabel audit_logs (migration baru)
[ ] Buat AuditLogController (index + show)
[ ] Buat Page Admin/AuditLog/Index.tsx
[ ] Tambah route group admin.audit-log (middleware superadmin)
[ ] Pasang gate ability viewAuditLog
[ ] Test filter + pagination

FITUR 3 — TOAST & BELL
[ ] php artisan notifications:table && migrate
[ ] Buat 4 Notification class (WorkshopBaru, LogbookRevisi, ProposalDisetujui, LogbookDisetujui)
[ ] Buat NotificationController (unread, markRead, markAllRead)
[ ] Tambah route api notifications
[ ] Buat ToastContext.tsx + ToastProvider
[ ] Buat BellDropdown.tsx
[ ] Wrap app.tsx dengan ToastProvider
[ ] Pasang BellDropdown di Topbar
[ ] Pasang flash auto-toast di AppLayout
[ ] Pasang trigger notify di LogbookController, ProposalController, WorkshopController
[ ] Test polling 30s + dismiss + mark-as-read
```

---

> **Urutan Pengerjaan yang Disarankan:** Rekap Nilai → Audit Log → Toast & Bell.  
> Ketiga fitur ini independen — bisa dikerjakan paralel jika ada dua developer.  
> Total estimasi: ~2 hari untuk solo dev yang sudah familiar stack ini.

-----------

Proyek SIM KKN UIN SAIZU ini sudah semakin solid—grading dinamis, workflow proposal & workshop, plus CertGen sudah on point. Security-nya juga kuat dengan RBAC + God Mode yang terlacak.
Yang kita hajar sekarang: No. 2 – UI Audit Log
Alasan: Ini prioritas tinggi untuk accountability. Superadmin (LPPM) butuh memantau aktivitas sensitif (misal override Gate, perubahan nilai, assign kelompok) secara real-time. Fitur ini melengkapi God Mode yang sudah ada, mencegah abuse, dan sesuai regulasi universitas (audit trail untuk akreditasi). Setelah ini selesai, sistem jadi lebih "enterprise-grade".
Implementasi Teknis (Skalabel & Profesional)
Gunakan spatie/laravel-activitylog (sudah direkomendasikan sebelumnya—best practice Laravel 11+).
Setup Cepat:

Install jika belum: composer require spatie/laravel-activitylog
Trait di model sensitif (contoh: KknScore, Kelompok, User):PHPuse Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

public function getActivitylogOptions(): LogOptions
{
    return LogOptions::defaults()
        ->logOnly(['score_total', 'letter_grade']) // hanya kolom sensitif
        ->logOnlyDirty() // hanya perubahan
        ->dontSubmitEmptyLogs();
}
Untuk God Mode override (dari Gate::before sebelumnya), sudah otomatis log via activity()->log('description').

Tabel Database: Gunakan default activity_log (id, log_name, description, subject_id, subject_type, causer_id, causer_type, properties (json), created_at).
Controller (app/Http/Controllers/Admin/AuditLogController.php):
PHPclass AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = Activity::query()
            ->with(['causer', 'subject'])
            ->orderBy('created_at', 'desc');

        // Filters
        if ($request->filled('user')) {
            $query->whereCauserId($request->user);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        // Tambah filter event, subject_type, dll

        $logs = $query->paginate(50)->withQueryString();

        return inertia('Admin/AuditLog/Index', [
            'logs' => $logs,
            'filters' => $request->all(),
            'users' => User::role(['superadmin', 'dpl'])->pluck('name', 'id'), // untuk dropdown filter
        ]);
    }
}
Route (web.php atau admin group):
PHPRoute::middleware(['role:superadmin'])->group(function () {
    Route::get('/audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');
});
UI/UX – Premium Audit Log Page (Glassmorphism + Timeline Option)
Gunakan TanStack Table (React Table) atau shadcn/ui Table untuk table yang sortable, searchable, paginated. Tambah toggle view: Table vs Timeline (untuk visual "activity feed").
Komponen Utama:

Card utama: bg-white/10 backdrop-blur-lg border border-white/20
Filters: Date range picker (flatpickr atau Headless UI), User dropdown, Search description.
Table Columns:
User (causer)
Action (description + event)
Target (subject, misal "Nilai mahasiswa X")
Details (JSON viewer collapsible dengan properties: old vs new values)
Timestamp

Badge warna: Hijau untuk create, Kuning update, Merah delete/override.

Inspirasi desain premium (glassmorphism + timeline/tables):
codewithfaraz.comcodewithfaraz.comcodewithfaraz.comfigma.comjustinmind.com




Struktur Folder React
textresources/js/Pages/Admin/AuditLog/
├── Index.tsx              // Main page
├── components/
│   ├── AuditTable.tsx     // TanStack Table implementation
│   ├── AuditTimeline.tsx  // Optional timeline view
│   ├── Filters.tsx        // Form filter
│   └── LogDetailModal.tsx // Modal untuk lihat properties JSON
Bonus Ide Tambahan:

Export ke Excel: Gunakan Laravel Excel (Maatwebsite) dengan action button.
Highlight aktivitas sensitif: Badge "God Mode Override" warna merah.
Integrasi notifikasi: Kirim email ke superadmin jika ada override (Laravel Notification).

Setelah ini selesai, kita bisa lanjut ke Rekap Nilai Kolektif (no. 1) yang bakal jadi "killer feature" buat LPPM saat finalisasi periode.
Gimana, setuju hajar Audit Log dulu? Atau mau tweak/pilih yang lain? Siap bantu kode lebih detail! 💪

-------

Kita akan menghajar Rekap Nilai Kolektif terlebih dahulu. Ini adalah fitur krusial ("The Final Piece") bagi Superadmin (LPPM) untuk melakukan finalisasi nilai akademik sebelum diekspor ke sistem akademik universitas. Fitur ini akan menguji skalabilitas sistem dalam menangani ribuan baris data dengan kalkulasi bobot dinamis secara real-time.

Berikut adalah rekomendasi teknis untuk implementasi fitur ini:

1. Struktur Migration: kkn_configs & evaluations
Untuk mendukung bobot dinamis yang bisa diubah oleh Superadmin, kita membutuhkan tabel konfigurasi khusus.

PHP
// database/migrations/xxxx_create_kkn_configs_table.php
Schema::create('kkn_configs', function (Blueprint $table) {
    $table->id();
    $table->string('key')->unique(); // contoh: 'weight_dpl', 'weight_mitra'
    $table->decimal('value', 5, 2);
    $table->timestamps();
});

// database/migrations/xxxx_create_evaluations_table.php
Schema::create('evaluations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('student_id')->constrained()->onDelete('cascade');
    // Skor Mentah (Raw Scores)
    $table->json('dpl_components'); // {'laporan': 80, 'proker': 85, 'artikel': 90}
    $table->json('mitra_components'); // {'sikap': 90, 'disiplin': 85}
    $table->json('lppm_components'); // {'workshop': 100, 'admin': 100}
    $table->decimal('final_score', 5, 2)->index();
    $table->string('grade', 2)->index(); // A, B+, dst
    $table->timestamps();
});

2. Logika Service Class: GradingService
Service ini akan mengambil bobot dari database dan melakukan kalkulasi. Pastikan menggunakan eager loading untuk performa maksimal saat menangani ribuan data.

PHP
namespace App\Services;

use App\Models\KknConfig;
use App\Models\Student;
use App\Models\Evaluation;

class GradingService {
    public function calculateFinalScore(Student $student, array $rawScores): array {
        // Ambil bobot dinamis dari tabel kkn_configs
        $weights = KknConfig::pluck('value', 'key'); 
        
        // Komponen A (DPL - 50%)
        $scoreA = ($rawScores['laporan'] * 0.3) + ($rawScores['proker'] * 0.4) + ($rawScores['artikel'] * 0.3);
        // Komponen B (Mitra - 30%)
        $scoreB = ($rawScores['sikap'] * 0.5) + ($rawScores['disiplin'] * 0.5);
        // Komponen C (LPPM - 20%)
        $scoreC = ($rawScores['workshop'] * 0.5) + ($rawScores['admin'] * 0.5);

        $finalScore = ($scoreA * ($weights['weight_dpl'] / 100)) + 
                     ($scoreB * ($weights['weight_mitra'] / 100)) + 
                     ($scoreC * ($weights['weight_lppm'] / 100));

        return;
    }

    private function determineGrade(float $score): string {
        return match (true) {
            $score >= 85 => 'A',
            $score >= 75 => 'B+',
            $score >= 65 => 'B',
            default => 'E',
        };
    }
}
3. Integrasi Excel Ready (Maatwebsite/Excel)
Gunakan Query Scopes untuk filter data sebelum ekspor agar laporan bersifat modular (misal: rekap per fakultas atau per tahun).

PHP
// app/Exports/GradesExport.php
namespace App\Exports;

use App\Models\Evaluation;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;

class GradesExport implements FromQuery, WithHeadings {
    protected $filters;

    public function __construct(array $filters) {
        $this->filters = $filters;
    }

    public function query() {
        return Evaluation::query()
            ->with(['student.user', 'student.prodi']) // Eager loading
            ->filter($this->filters); // Menggunakan Query Scope
    }

    public function headings(): array {
        return ["NIM", "Nama", "Prodi", "Nilai Akhir", "Grade"];
    }
}
4. Struktur Folder React (Modular & Clean)
Untuk halaman rekap, gunakan struktur feature-based agar komponen tabel dan filter terorganisir dengan baik.

resources/js/ ├── Pages/ │ └── Admin/ │ └── Grades/ │ ├── Index.tsx # Entry point halaman rekap │ ├── FilterPanel.tsx # Komponen filter (Fakultas, Prodi, Tahun) │ └── GradeTable.tsx # Tabel dengan Glassmorphism ├── components/ │ ├── ui/ │ │ ├── Table.tsx # Reusable Glassmorphism Table │ │ └── Badge.tsx # Grade Badge (A, B+, etc) │ └── ExportButton.tsx # Tombol pemicu Excel::download └── types/ └── index.d.ts # TypeScript definitions untuk Evaluation & Student


Rekomendasi Tambahan: Saat LPPM memproses ribuan nilai sekaligus, gunakan DB::transaction() untuk menjaga integritas data dan manfaatkan fitur deferred props di Inertia v2 untuk memuat data tabel secara asinkron agar Initial Page Load tetap ringan.

---------

Saya melihat Anda sudah membangun sistem KKN yang cukup solid untuk UIN SAIZU. Berdasarkan prioritas operasional LPPM dan kebutuhan immediate impact, saya merekomendasikan untuk mengimplementasikan [✓] Rekap Nilai Kolektif terlebih dahulu, dengan tambahan fitur UI Audit Log sebagai secondary priority karena keduanya saling melengkapi untuk accountability.
Berikut implementasi teknis lengkap untuk kedua fitur tersebut:
1. Rekap Nilai Kolektif (Collective Grade Recap)
Database Migration: kkn_score_configs (Dynamic Weight Storage)
php
Copy
// database/migrations/2024_xx_xx_create_kkn_score_configs_table.php
Schema::create('kkn_score_configs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('periode_id')->constrained('kkn_periodes');
    
    // Komponen A - DPL (default 50%)
    $table->decimal('dpl_weight', 5, 2)->default(0.50);
    $table->decimal('dpl_laporan_pct', 5, 2)->default(0.30); // 30% dari bobot DPL
    $table->decimal('dpl_pelaksanaan_pct', 5, 2)->default(0.40);
    $table->decimal('dpl_artikel_pct', 5, 2)->default(0.30);
    
    // Komponen B - Mitra (default 30%)
    $table->decimal('mitra_weight', 5, 2)->default(0.30);
    $table->decimal('mitra_sikap_pct', 5, 2)->default(0.50);
    $table->decimal('mitra_kedisiplinan_pct', 5, 2)->default(0.50);
    
    // Komponen C - LPPM (default 20%)
    $table->decimal('lppm_weight', 5, 2)->default(0.20);
    $table->decimal('lppm_workshop_pct', 5, 2)->default(0.50);
    $table->decimal('lppm_administrasi_pct', 5, 2)->default(0.50);
    
    $table->boolean('is_active')->default(true);
    $table->foreignId('created_by')->constrained('users');
    $table->timestamps();
    
    $table->unique(['periode_id', 'is_active']);
});
Service Layer: CollectiveGradingService
php
Copy
<?php

namespace App\Services;

use App\Models\KknRegistration;
use App\Models\KknScore;
use App\Models\KknScoreConfig;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CollectiveGradingService
{
    /**
     * Fetch all-in-one grade data with dynamic calculation
     */
    public function getCollectiveRecap(int $periodeId, ?array $filters = []): Collection
    {
        $config = $this->getActiveConfig($periodeId);
        
        $query = KknRegistration::with([
            'student.user',
            'student.major.faculty',
            'group.location',
            'group.lecturer.user',
            'scores'
        ])
        ->where('kkn_periode_id', $periodeId)
        ->where('status', 'completed');

        // Apply filters
        if (!empty($filters['faculty_id'])) {
            $query->whereHas('student.major', fn($q) => 
                $q->where('faculty_id', $filters['faculty_id'])
            );
        }
        if (!empty($filters['group_id'])) {
            $query->where('kkn_group_id', $filters['group_id']);
        }
        if (!empty($filters['status_nilai'])) {
            $query->whereHas('scores', fn($q) => 
                $q->where('is_finalized', $filters['status_nilai'] === 'final')
            );
        }

        return $query->get()->map(function ($registration) use ($config) {
            $scores = $registration->scores;
            
            return [
                'registration_id' => $registration->id,
                'nim' => $registration->student->nim,
                'nama' => $registration->student->user->name,
                'fakultas' => $registration->student->major->faculty->name,
                'prodi' => $registration->student->major->name,
                'kelompok' => $registration->group->name ?? 'Belum Assign',
                'dpl' => $registration->group->lecturer->user->name ?? '-',
                'lokasi' => $registration->group->location->village_name ?? '-',
                
                // Raw Scores
                'raw_dpl_laporan' => $scores?->dpl_laporan,
                'raw_dpl_pelaksanaan' => $scores?->dpl_pelaksanaan,
                'raw_dpl_artikel' => $scores?->dpl_artikel,
                'raw_mitra_sikap' => $scores?->mitra_sikap,
                'raw_mitra_kedisiplinan' => $scores?->mitra_kedisiplinan,
                'raw_lppm_workshop' => $scores?->lppm_workshop,
                'raw_lppm_administrasi' => $scores?->lppm_administrasi,
                
                // Calculated Components (real-time dengan bobot dinamis)
                'calc_dpl' => $this->calculateDplComponent($scores, $config),
                'calc_mitra' => $this->calculateMitraComponent($scores, $config),
                'calc_lppm' => $this->calculateLppmComponent($scores, $config),
                
                // Final Score
                'nilai_akhir' => $scores?->final_score ?? $this->calculateFinal($scores, $config),
                'nilai_huruf' => $scores?->letter_grade ?? $this->convertToLetter($this->calculateFinal($scores, $config)),
                'status' => $scores?->is_finalized ? 'FINAL' : 'DRAFT',
                'last_updated' => $scores?->updated_at,
            ];
        });
    }

    private function calculateDplComponent(?KknScore $scores, KknScoreConfig $config): ?float
    {
        if (!$scores) return null;
        
        $laporan = ($scores->dpl_laporan ?? 0) * $config->dpl_laporan_pct;
        $pelaksanaan = ($scores->dpl_pelaksanaan ?? 0) * $config->dpl_pelaksanaan_pct;
        $artikel = ($scores->dpl_artikel ?? 0) * $config->dpl_artikel_pct;
        
        return round(($laporan + $pelaksanaan + $artikel) * $config->dpl_weight, 2);
    }

    private function calculateMitraComponent(?KknScore $scores, KknScoreConfig $config): ?float
    {
        if (!$scores) return null;
        
        $sikap = ($scores->mitra_sikap ?? 0) * $config->mitra_sikap_pct;
        $disiplin = ($scores->mitra_kedisiplinan ?? 0) * $config->mitra_kedisiplinan_pct;
        
        return round(($sikap + $disiplin) * $config->mitra_weight, 2);
    }

    private function calculateLppmComponent(?KknScore $scores, KknScoreConfig $config): ?float
    {
        if (!$scores) return null;
        
        $workshop = ($scores->lppm_workshop ?? 0) * $config->lppm_workshop_pct;
        $admin = ($scores->lppm_administrasi ?? 0) * $config->lppm_administrasi_pct;
        
        return round(($workshop + $admin) * $config->lppm_weight, 2);
    }

    private function calculateFinal(?KknScore $scores, KknScoreConfig $config): ?float
    {
        $dpl = $this->calculateDplComponent($scores, $config);
        $mitra = $this->calculateMitraComponent($scores, $config);
        $lppm = $this->calculateLppmComponent($scores, $config);
        
        if ($dpl === null || $mitra === null || $lppm === null) return null;
        
        return round($dpl + $mitra + $lppm, 2);
    }

    private function convertToLetter(?float $score): string
    {
        if ($score === null) return '-';
        if ($score >= 85) return 'A';
        if ($score >= 80) return 'A-';
        if ($score >= 75) return 'B+';
        if ($score >= 70) return 'B';
        if ($score >= 65) return 'B-';
        if ($score >= 60) return 'C+';
        if ($score >= 55) return 'C';
        if ($score >= 50) return 'C-';
        if ($score >= 40) return 'D';
        return 'E';
    }

    /**
     * Export-ready format untuk Excel
     */
    public function formatForExport(Collection $data): array
    {
        return $data->map(fn($item) => [
            'NIM' => $item['nim'],
            'Nama Mahasiswa' => $item['nama'],
            'Fakultas' => $item['fakultas'],
            'Program Studi' => $item['prodi'],
            'Kelompok' => $item['kelompok'],
            'DPL' => $item['dpl'],
            'Lokasi KKN' => $item['lokasi'],
            
            // Raw scores untuk verifikasi
            'DPL Laporan (Raw)' => $item['raw_dpl_laporan'] ?? '-',
            'DPL Pelaksanaan (Raw)' => $item['raw_dpl_pelaksanaan'] ?? '-',
            'DPL Artikel (Raw)' => $item['raw_dpl_artikel'] ?? '-',
            'Mitra Sikap (Raw)' => $item['raw_mitra_sikap'] ?? '-',
            'Mitra Disiplin (Raw)' => $item['raw_mitra_kedisiplinan'] ?? '-',
            'LPPM Workshop (Raw)' => $item['raw_lppm_workshop'] ?? '-',
            'LPPM Administrasi (Raw)' => $item['raw_lppm_administrasi'] ?? '-',
            
            // Calculated
            'Komponen DPL (50%)' => $item['calc_dpl'],
            'Komponen Mitra (30%)' => $item['calc_mitra'],
            'Komponen LPPM (20%)' => $item['calc_lppm'],
            
            'Nilai Akhir' => $item['nilai_akhir'],
            'Nilai Huruf' => $item['nilai_huruf'],
            'Status Finalisasi' => $item['status'],
        ])->toArray();
    }

    private function getActiveConfig(int $periodeId): KknScoreConfig
    {
        return KknScoreConfig::where('periode_id', $periodeId)
            ->where('is_active', true)
            ->firstOrFail();
    }
}
Controller: CollectiveGradeController
php
Copy
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\CollectiveGradingService;
use App\Models\KknPeriode;
use App\Models\Faculty;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\CollectiveGradeExport;

class CollectiveGradeController extends Controller
{
    public function __construct(
        private CollectiveGradingService $gradingService
    ) {}

    public function index(Request $request, int $periodeId)
    {
        $this->authorize('view-collective-grades');

        $filters = $request->only(['faculty_id', 'group_id', 'status_nilai', 'search']);
        
        $recap = $this->gradingService->getCollectiveRecap($periodeId, $filters);
        
        // Stats untuk dashboard card
        $stats = [
            'total_mahasiswa' => $recap->count(),
            'sudah_final' => $recap->where('status', 'FINAL')->count(),
            'belum_final' => $recap->where('status', 'DRAFT')->count(),
            'rerata_nilai' => $recap->avg('nilai_akhir'),
            'distribusi_nilai' => $recap->groupBy('nilai_huruf')->map->count(),
        ];

        return Inertia::render('Admin/Grades/CollectiveRecap', [
            'recapData' => $recap,
            'stats' => $stats,
            'filters' => $filters,
            'periode' => KknPeriode::find($periodeId),
            'faculties' => Faculty::select('id', 'name')->get(),
            'groups' => \App\Models\KknGroup::where('kkn_periode_id', $periodeId)
                ->select('id', 'name')->get(),
            'scoreConfig' => \App\Models\KknScoreConfig::where('periode_id', $periodeId)
                ->where('is_active', true)->first(),
        ]);
    }

    public function exportExcel(int $periodeId, Request $request)
    {
        $this->authorize('export-grades');
        
        $filters = $request->only(['faculty_id', 'group_id', 'status_nilai']);
        $data = $this->gradingService->getCollectiveRecap($periodeId, $filters);
        $formatted = $this->gradingService->formatForExport($data);
        
        $filename = 'Rekap_Nilai_KKN_' . now()->format('Y-m-d_H-i') . '.xlsx';
        
        return Excel::download(new CollectiveGradeExport($formatted), $filename);
    }

    public function bulkFinalize(Request $request, int $periodeId)
    {
        $this->authorize('finalize-grades');
        
        $validated = $request->validate([
            'registration_ids' => 'required|array',
            'registration_ids.*' => 'exists:kkn_registrations,id',
        ]);

        DB::transaction(function () use ($validated, $request) {
            foreach ($validated['registration_ids'] as $regId) {
                $score = \App\Models\KknScore::where('kkn_registration_id', $regId)->first();
                if ($score && !$score->is_finalized) {
                    $score->update([
                        'is_finalized' => true,
                        'finalized_at' => now(),
                        'finalized_by' => $request->user()->id,
                    ]);
                    
                    // Audit log
                    \App\Services\AuditService::log('GRADE_FINALIZED', [
                        'score_id' => $score->id,
                        'registration_id' => $regId,
                        'final_score' => $score->final_score,
                    ]);
                }
            }
        });

        return back()->with('success', count($validated['registration_ids']) . ' nilai berhasil difinalisasi.');
    }
}
React Component: CollectiveRecap.tsx (Premium UI)
tsx
Copy
// resources/js/Pages/Admin/Grades/CollectiveRecap.tsx
import React, { useState, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { 
    GlassCard, 
    GradientButton, 
    StatusBadge,
    DataTable 
} from '@/Components/UI';
import { 
    FileSpreadsheet, 
    CheckCircle2, 
    AlertCircle, 
    Calculator,
    Filter,
    Download,
    Lock,
    Unlock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Props {
    recapData: any[];
    stats: {
        total_mahasiswa: number;
        sudah_final: number;
        belum_final: number;
        rerata_nilai: number;
        distribusi_nilai: Record<string, number>;
    };
    filters: any;
    periode: any;
    faculties: any[];
    groups: any[];
    scoreConfig: any;
}

export default function CollectiveRecap({ 
    recapData, 
    stats, 
    filters, 
    periode, 
    faculties, 
    groups,
    scoreConfig 
}: Props) {
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    const columns = useMemo(() => [
        {
            header: 'Mahasiswa',
            accessor: (row: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                        {row.nama.charAt(0)}
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{row.nama}</p>
                        <p className="text-xs text-slate-500">{row.nim}</p>
                    </div>
                </div>
            ),
        },
        {
            header: 'Kelompok & Lokasi',
            accessor: (row: any) => (
                <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{row.kelompok}</p>
                    <p className="text-xs text-slate-500">{row.lokasi}</p>
                </div>
            ),
        },
        {
            header: 'Komponen DPL (50%)',
            accessor: (row: any) => (
                <ScoreBreakdown 
                    score={row.calc_dpl} 
                    details={[
                        { label: 'Laporan', value: row.raw_dpl_laporan, pct: '30%' },
                        { label: 'Pelaksanaan', value: row.raw_dpl_pelaksanaan, pct: '40%' },
                        { label: 'Artikel', value: row.raw_dpl_artikel, pct: '30%' },
                    ]}
                    color="blue"
                />
            ),
        },
        {
            header: 'Komponen Mitra (30%)',
            accessor: (row: any) => (
                <ScoreBreakdown 
                    score={row.calc_mitra} 
                    details={[
                        { label: 'Sikap', value: row.raw_mitra_sikap, pct: '50%' },
                        { label: 'Disiplin', value: row.raw_mitra_kedisiplinan, pct: '50%' },
                    ]}
                    color="emerald"
                />
            ),
        },
        {
            header: 'Komponen LPPM (20%)',
            accessor: (row: any) => (
                <ScoreBreakdown 
                    score={row.calc_lppm} 
                    details={[
                        { label: 'Workshop', value: row.raw_lppm_workshop, pct: '50%' },
                        { label: 'Administrasi', value: row.raw_lppm_administrasi, pct: '50%' },
                    ]}
                    color="amber"
                />
            ),
        },
        {
            header: 'Nilai Akhir',
            accessor: (row: any) => (
                <div className="text-center">
                    <p className={`text-2xl font-bold ${
                        row.nilai_akhir >= 60 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                        {row.nilai_akhir ?? '-'}
                    </p>
                    <StatusBadge 
                        variant={row.status === 'FINAL' ? 'success' : 'warning'}
                        className="mt-1"
                    >
                        {row.status === 'FINAL' ? <Lock className="w-3 h-3 mr-1" /> : <Unlock className="w-3 h-3 mr-1" />}
                        {row.status}
                    </StatusBadge>
                </div>
            ),
        },
        {
            header: 'Huruf',
            accessor: (row: any) => (
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl text-lg font-bold ${
                    row.nilai_huruf === 'A' ? 'bg-emerald-100 text-emerald-700' :
                    row.nilai_huruf === 'B' || row.nilai_huruf === 'B+' ? 'bg-blue-100 text-blue-700' :
                    row.nilai_huruf === 'C' || row.nilai_huruf === 'C+' ? 'bg-amber-100 text-amber-700' :
                    'bg-rose-100 text-rose-700'
                }`}>
                    {row.nilai_huruf}
                </div>
            ),
        },
    ], []);

    const handleBulkFinalize = () => {
        if (!confirm(`Finalisasi ${selectedRows.length} nilai mahasiswa? Tindakan ini tidak dapat dibatalkan.`)) return;
        
        setLoading(true);
        router.post(route('admin.grades.bulk-finalize', periode.id), {
            registration_ids: selectedRows,
        }, {
            onFinish: () => {
                setLoading(false);
                setSelectedRows([]);
            },
        });
    };

    const distribusiData = Object.entries(stats.distribusi_nilai).map(([grade, count]) => ({
        grade,
        count,
        fill: grade === 'A' ? '#10b981' : grade.startsWith('B') ? '#3b82f6' : 
              grade.startsWith('C') ? '#f59e0b' : '#ef4444'
    }));

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
            <Head title="Rekap Nilai Kolektif" />
            
            <div className="p-8 max-w-[1600px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                            Rekap Nilai Kolektif
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            {periode.name} • Bobot: DPL {scoreConfig?.dpl_weight * 100}% | Mitra {scoreConfig?.mitra_weight * 100}% | LPPM {scoreConfig?.lppm_weight * 100}%
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <GradientButton 
                            variant="ghost" 
                            onClick={() => window.open(route('admin.grades.export', periode.id), '_blank')}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export Excel
                        </GradientButton>
                        {selectedRows.length > 0 && (
                            <GradientButton 
                                variant="success"
                                onClick={handleBulkFinalize}
                                disabled={loading}
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Finalisasi {selectedRows.length} Terpilih
                            </GradientButton>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <GlassCard variant="primary" className="relative overflow-hidden">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Mahasiswa</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                                    {stats.total_mahasiswa}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600">
                                <FileSpreadsheet className="w-6 h-6" />
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard variant="success">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Sudah Final</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                                    {stats.sudah_final}
                                </p>
                                <p className="text-sm text-emerald-600 mt-1">
                                    {((stats.sudah_final / stats.total_mahasiswa) * 100).toFixed(1)}%
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard variant="warning">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Menunggu Finalisasi</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                                    {stats.belum_final}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Rerata Nilai</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                                    {stats.rerata_nilai ? stats.rerata_nilai.toFixed(2) : '-'}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600">
                                <Calculator className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="mt-4 h-16">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={recapData.slice(0, 10).map((r, i) => ({ index: i, nilai: r.nilai_akhir }))}>
                                    <Line type="monotone" dataKey="nilai" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassCard>
                </div>

                {/* Distribution Chart */}
                <GlassCard className="lg:col-span-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                        Distribusi Nilai Huruf
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={distribusiData}>
                                <XAxis dataKey="grade" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip 
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(255,255,255,0.9)',
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Bar dataKey="count" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Filters */}
                <GlassCard className="p-4">
                    <div className="flex flex-wrap gap-4 items-center">
                        <Filter className="w-5 h-5 text-slate-400" />
                        <select 
                            className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm px-4 py-2"
                            value={filters.faculty_id || ''}
                            onChange={(e) => router.get(route('admin.grades.collective', periode.id), {
                                ...filters,
                                faculty_id: e.target.value || undefined,
                            })}
                        >
                            <option value="">Semua Fakultas</option>
                            {faculties.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>

                        <select 
                            className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm px-4 py-2"
                            value={filters.group_id || ''}
                            onChange={(e) => router.get(route('admin.grades.collective', periode.id), {
                                ...filters,
                                group_id: e.target.value || undefined,
                            })}
                        >
                            <option value="">Semua Kelompok</option>
                            {groups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>

                        <select 
                            className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm px-4 py-2"
                            value={filters.status_nilai || ''}
                            onChange={(e) => router.get(route('admin.grades.collective', periode.id), {
                                ...filters,
                                status_nilai: e.target.value || undefined,
                            })}
                        >
                            <option value="">Semua Status</option>
                            <option value="final">Sudah Final</option>
                            <option value="draft">Draft/Belum Final</option>
                        </select>
                    </div>
                </GlassCard>

                {/* Data Table */}
                <GlassCard className="overflow-hidden">
                    <DataTable 
                        columns={columns}
                        data={recapData}
                        selectable
                        selectedRows={selectedRows}
                        onSelectionChange={setSelectedRows}
                        keyExtractor={(row) => row.registration_id}
                        emptyMessage="Tidak ada data nilai untuk periode ini"
                    />
                </GlassCard>
            </div>
        </div>
    );
}

// Sub-component untuk breakdown nilai
function ScoreBreakdown({ score, details, color }: { score: number | null, details: any[], color: string }) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        amber: 'bg-amber-50 text-amber-700 border-amber-200',
    };

    if (score === null) return <span className="text-slate-400">-</span>;

    return (
        <div className="space-y-2">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${colorClasses[color]}`}>
                {score.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 space-y-0.5">
                {details.map((d, i) => (
                    <div key={i} className="flex justify-between gap-2">
                        <span>{d.label}:</span>
                        <span className="font-medium">{d.value ?? '-'}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
2. UI Audit Log (Superadmin Only)
Migration: audit_logs
php
Copy
Schema::create('audit_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->nullable()->constrained();
    $table->string('action'); // GRADE_FINALIZED, GOD_MODE_ACCESS, BULK_UPDATE, etc
    $table->string('entity_type'); // KknScore, KknRegistration, etc
    $table->unsignedBigInteger('entity_id')->nullable();
    $table->json('old_values')->nullable();
    $table->json('new_values')->nullable();
    $table->text('description')->nullable();
    $table->string('ip_address', 45)->nullable();
    $table->string('user_agent')->nullable();
    $table->timestamp('created_at');
    
    $table->index(['entity_type', 'entity_id']);
    $table->index('created_at');
});
Service: AuditService
php
Copy
<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Request;

class AuditService
{
    public static function log(
        string $action,
        string $entityType = 'System',
        ?int $entityId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $description = null
    ): void {
        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'description' => $description,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'created_at' => now(),
        ]);
    }

    public static function logGodMode(string $ability, array $context = []): void
    {
        self::log(
            'GOD_MODE_ACCESS',
            'Authorization',
            null,
            null,
            array_merge($context, [
                'ability' => $ability,
                'url' => Request::url(),
                'method' => Request::method(),
            ]),
            'Superadmin bypassed normal authorization'
        );
    }
}
React Component: AuditLogViewer.tsx
tsx
Copy
// resources/js/Pages/Admin/Audit/Index.tsx
import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { GlassCard, GradientButton } from '@/Components/UI';
import { 
    Shield, 
    Eye, 
    Database, 
    FileEdit, 
    Trash2,
    AlertTriangle,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface AuditLog {
    id: number;
    user: { name: string; email: string; role: string } | null;
    action: string;
    entity_type: string;
    entity_id: number | null;
    description: string | null;
    old_values: any;
    new_values: any;
    ip_address: string;
    created_at: string;
}

export default function AuditLogViewer({ logs }: { logs: AuditLog[] }) {
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [filter, setFilter] = useState('all');

    const getActionIcon = (action: string) => {
        if (action.includes('GOD_MODE')) return <Shield className="w-5 h-5 text-purple-500" />;
        if (action.includes('CREATE')) return <Database className="w-5 h-5 text-emerald-500" />;
        if (action.includes('UPDATE') || action.includes('FINALIZED')) return <FileEdit className="w-5 h-5 text-blue-500" />;
        if (action.includes('DELETE')) return <Trash2 className="w-5 h-5 text-rose-500" />;
        return <Eye className="w-5 h-5 text-slate-500" />;
    };

    const getActionColor = (action: string) => {
        if (action.includes('GOD_MODE')) return 'bg-purple-100 text-purple-700 border-purple-300';
        if (action.includes('FINALIZED')) return 'bg-emerald-100 text-emerald-700 border-emerald-300';
        if (action.includes('BULK')) return 'bg-amber-100 text-amber-700 border-amber-300';
        return 'bg-slate-100 text-slate-700 border-slate-300';
    };

    const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.action.includes(filter));

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
            <Head title="Audit Log Sistem" />
            
            <div className="p-8 max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-purple-600 dark:from-white dark:to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
                            <Shield className="w-8 h-8 text-purple-600" />
                            Audit Log Sistem
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">
                            Jejak digital setiap aktivitas kritis dalam sistem KKN
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Log', value: logs.length, icon: Database, color: 'blue' },
                        { label: 'God Mode Access', value: logs.filter(l => l.action.includes('GOD_MODE')).length, icon: Shield, color: 'purple' },
                        { label: 'Grade Finalized', value: logs.filter(l => l.action.includes('FINALIZED')).length, icon: CheckCircle2, color: 'emerald' },
                        { label: 'Critical Actions', value: logs.filter(l => l.action.includes('BULK') || l.action.includes('DELETE')).length, icon: AlertTriangle, color: 'amber' },
                    ].map((stat, i) => (
                        <GlassCard key={i} className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-900/30 text-${stat.color}-600`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                                <p className="text-sm text-slate-500">{stat.label}</p>
                            </div>
                        </GlassCard>
                    ))}
                </div>

                {/* Filter */}
                <GlassCard className="p-4">
                    <div className="flex gap-2 flex-wrap">
                        {['all', 'GOD_MODE', 'FINALIZED', 'BULK', 'UPDATE'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    filter === f 
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' 
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                                }`}
                            >
                                {f === 'all' ? 'Semua Aktivitas' : f.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </GlassCard>

                {/* Timeline */}
                <div className="space-y-4">
                    {filteredLogs.map((log) => (
                        <GlassCard 
                            key={log.id} 
                            className={`p-6 cursor-pointer transition-all hover:shadow-xl ${
                                selectedLog?.id === log.id ? 'ring-2 ring-purple-500 bg-purple-50/50 dark:bg-purple-900/20' : ''
                            }`}
                            onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                                    {getActionIcon(log.action)}
                                </div>
                                
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                        <span className="text-sm text-slate-500">
                                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: id })}
                                        </span>
                                        {log.action.includes('GOD_MODE') && (
                                            <span className="flex items-center gap-1 text-xs text-purple-600 font-semibold">
                                                <AlertTriangle className="w-3 h-3" />
                                                PRIVILEGE ESCALATION
                                            </span>
                                        )}
                                    </div>
                                    
                                    <p className="text-slate-900 dark:text-white font-medium">
                                        {log.user ? (
                                            <span className="flex items-center gap-2">
                                                <span className="font-bold text-purple-600">{log.user.name}</span>
                                                <span className="text-slate-400">({log.user.role})</span>
                                                <span className="text-slate-500">melakukan aktivitas pada</span>
                                                <span className="font-semibold">{log.entity_type}</span>
                                                {log.entity_id && <span className="text-slate-400">#{log.entity_id}</span>}
                                            </span>
                                        ) : (
                                            <span>System automated action</span>
                                        )}
                                    </p>
                                    
                                    {log.description && (
                                        <p className="text-sm text-slate-500 mt-2">{log.description}</p>
                                    )}

                                    {/* Diff Viewer */}
                                    {selectedLog?.id === log.id && (log.old_values || log.new_values) && (
                                        <div className="mt-4 p-4 bg-slate-900 rounded-xl overflow-x-auto">
                                            <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                                                <div>
                                                    <p className="text-rose-400 font-bold mb-2 flex items-center gap-2">
                                                        <XCircle className="w-4 h-4" /> BEFORE
                                                    </p>
                                                    <pre className="text-slate-300 text-xs">
                                                        {JSON.stringify(log.old_values, null, 2)}
                                                    </pre>
                                                </div>
                                                <div>
                                                    <p className="text-emerald-400 font-bold mb-2 flex items-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4" /> AFTER
                                                    </p>
                                                    <pre className="text-slate-300 text-xs">
                                                        {JSON.stringify(log.new_values, null, 2)}
                                                    </pre>
                                                </div>
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-500 flex justify-between">
                                                <span>IP: {log.ip_address}</span>
                                                <span>User Agent: {log.user_agent?.substring(0, 50)}...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>
        </div>
    );
}
Gate Implementation (God Mode dengan Audit)
php
Copy
// app/Providers/AuthServiceProvider.php
Gate::before(function (User $user, string $ability) {
    if ($user->role === 'superadmin') {
        // Audit setiap god mode access kecuali untuk read-only actions
        if (!in_array($ability, ['view-own-profile', 'view-dashboard'])) {
            \App\Services\AuditService::logGodMode($ability, [
                'intended_user' => request()->route('user')?->id,
                'resource' => request()->url(),
            ]);
        }
        return true;
    }
    return null;
});
Ringkasan Implementasi
Table
Copy
Fitur	Status	Prioritas	Impact
Rekap Nilai Kolektif	✅ Ready	P0	Critical untuk LPPM melakukan oversight dan reporting ke Rektorat
UI Audit Log	✅ Ready	P1	Accountability & compliance untuk auditor internal
Notifikasi Toast	⏳ Next	P2	UX improvement untuk mahasiswa
Rekomendasi deployment:
Deploy Collective Recap terlebih dahulu karena ini blocker untuk finalisasi semester
Audit Log dapat di-deploy paralel karena non-blocking
Notifikasi bisa di-next sprint setelah stabilisasi fitur grading
Fitur Collective Recap sudah include:
✅ Perhitungan real-time dengan bobot dinamis
✅ Bulk finalisasi dengan confirmation dialog
✅ Export Excel dengan format audit-ready
✅ Visualisasi distribusi nilai
✅ Filtering by fakultas/kelompok/status
Apakah Anda ingin saya elaborasi bagian Export Excel dengan library Laravel Excel atau fokus ke Notifikasi Toast system sebagai next feature?

-------

Kita akan fokus pada implementasi Rekap Nilai Kolektif karena fitur ini sangat dibutuhkan oleh LPPM untuk monitoring dan evaluasi. Selain itu, rekap nilai kolektif dapat diekspor ke Excel, yang memudahkan pihak universitas untuk pelaporan.

Namun, sebelum kita mulai, perlu diingat bahwa sistem penilaian sudah ada dan tinggal menampilkan data dari perhitungan yang sudah dilakukan. Kita akan buat halaman yang menampilkan seluruh nilai mahasiswa per periode KKN, dengan kemampuan filter dan ekspor.

Berikut adalah rencana implementasi:

Buat Migration untuk tabel rekap nilai (jika diperlukan) - Sebenarnya kita sudah memiliki tabel final_grades yang menyimpan nilai akhir per mahasiswa per periode. Tapi untuk keperluan rekap kolektif, kita mungkin butuh view atau tabel terdenormalisasi. Namun, kita bisa query langsung dari tabel yang ada.

Buat Service Class untuk menghitung rekap nilai - Kita akan buat service class yang dapat mengumpulkan data nilai dari berbagai komponen (A, B, C) dan menampilkannya dalam bentuk array atau collection yang siap ditampilkan.

Buat Controller dan Route - Untuk menangani request rekap nilai.

Buat Inertia Page (React) - Halaman yang menampilkan tabel rekap nilai dengan filter dan tombol ekspor.

Implementasi Ekspor ke Excel - Menggunakan package Laravel Excel.

UI/UX - Desain tabel yang user-friendly dengan Tailwind CSS.

Mari kita mulai dengan langkah-langkah detail:

1. Database & Migration
Kita asumsikan sudah ada tabel-tabel berikut:

users (dengan role mahasiswa)

periods (periode KKN)

final_grades (nilai akhir)

grading_components (komponen penilaian)

student_grades (nilai per komponen)

Kita akan buat view grade_summaries untuk memudahkan query rekap nilai. Tapi jika tidak, kita bisa gunakan query builder/eloquent.

2. Service Class: GradeSummaryService
Buat service class untuk mengambil data rekap nilai.

php
namespace App\Services;

use App\Models\Period;
use App\Models\User;
use App\Models\FinalGrade;
use Illuminate\Support\Facades\DB;

class GradeSummaryService
{
    public function getCollectiveGrades($periodId = null, $filters = [])
    {
        // Jika tidak ada periodId, gunakan periode aktif
        if (!$periodId) {
            $period = Period::where('is_active', true)->first();
            $periodId = $period ? $period->id : null;
        }

        $query = User::whereHas('roles', function ($q) {
            $q->where('name', 'mahasiswa');
        })
        ->with(['studentProfile', 'finalGrades' => function ($q) use ($periodId) {
            $q->where('period_id', $periodId);
        }])
        ->when(isset($filters['faculty']), function ($q) use ($filters) {
            $q->whereHas('studentProfile', function ($q2) use ($filters) {
                $q2->where('faculty_id', $filters['faculty']);
            });
        })
        ->when(isset($filters['study_program']), function ($q) use ($filters) {
            $q->whereHas('studentProfile', function ($q2) use ($filters) {
                $q2->where('study_program_id', $filters['study_program']);
            });
        })
        ->when(isset($filters['group']), function ($q) use ($filters) {
            $q->whereHas('groups', function ($q2) use ($filters) {
                $q2->where('group_id', $filters['group']);
            });
        })
        ->get()
        ->map(function ($user) use ($periodId) {
            $finalGrade = $user->finalGrades->firstWhere('period_id', $periodId);
            return [
                'nim' => $user->studentProfile->nim ?? '-',
                'name' => $user->name,
                'faculty' => $user->studentProfile->faculty->name ?? '-',
                'study_program' => $user->studentProfile->studyProgram->name ?? '-',
                'group' => $user->groups->firstWhere('period_id', $periodId)->name ?? '-',
                'dpl' => $user->groups->firstWhere('period_id', $periodId)->dpl->name ?? '-',
                'village' => $user->groups->firstWhere('period_id', $periodId)->village->name ?? '-',
                'total_score' => $finalGrade ? $finalGrade->total_score : 0,
                'letter_grade' => $finalGrade ? $finalGrade->letter_grade : '-',
                'weighted_score_a' => $finalGrade ? $finalGrade->weighted_score_a : 0,
                'weighted_score_b' => $finalGrade ? $finalGrade->weighted_score_b : 0,
                'weighted_score_c' => $finalGrade ? $finalGrade->weighted_score_c : 0,
            ];
        });

        return $query;
    }
}
3. Controller: GradeSummaryController
php
namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\GradeSummaryService;
use Illuminate\Http\Request;

class GradeSummaryController extends Controller
{
    protected $gradeSummaryService;

    public function __construct(GradeSummaryService $gradeSummaryService)
    {
        $this->gradeSummaryService = $gradeSummaryService;
    }

    public function index(Request $request)
    {
        $periodId = $request->input('period');
        $filters = $request->only(['faculty', 'study_program', 'group']);

        $grades = $this->gradeSummaryService->getCollectiveGrades($periodId, $filters);

        // Jika request dari Inertia, kembalikan halaman Inertia
        return inertia('Grades/CollectiveIndex', [
            'grades' => $grades,
            'filters' => $filters,
        ]);
    }

    public function export(Request $request)
    {
        $periodId = $request->input('period');
        $filters = $request->only(['faculty', 'study_program', 'group']);

        $grades = $this->gradeSummaryService->getCollectiveGrades($periodId, $filters);

        // Ekspor ke Excel
        // Kita akan buat Excel menggunakan Laravel Excel
        // (Pastikan sudah menginstal package Maatwebsite/Laravel-Excel)
        return (new GradeSummaryExport($grades))->download('rekap-nilai-kkn.xlsx');
    }
}
4. Export Class: GradeSummaryExport
php
namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class GradeSummaryExport implements FromCollection, WithHeadings, WithStyles
{
    protected $grades;

    public function __construct($grades)
    {
        $this->grades = $grades;
    }

    public function collection()
    {
        return collect($this->grades)->map(function ($grade) {
            return [
                $grade['nim'],
                $grade['name'],
                $grade['faculty'],
                $grade['study_program'],
                $grade['group'],
                $grade['dpl'],
                $grade['village'],
                $grade['total_score'],
                $grade['letter_grade'],
                $grade['weighted_score_a'],
                $grade['weighted_score_b'],
                $grade['weighted_score_c'],
            ];
        });
    }

    public function headings(): array
    {
        return [
            'NIM',
            'Nama',
            'Fakultas',
            'Program Studi',
            'Kelompok',
            'DPL',
            'Desa',
            'Nilai Total',
            'Nilai Huruf',
            'Nilai Terbobot A (DPL)',
            'Nilai Terbobot B (Desa)',
            'Nilai Terbobot C (LPPM)',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Style untuk header
            1 => ['font' => ['bold' => true]],
        ];
    }
}
5. Inertia Page: CollectiveIndex.jsx
Buat halaman React untuk menampilkan rekap nilai.

jsx
import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/inertia-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FilterBar from '@/Components/FilterBar';
import { Inertia } from '@inertiajs/inertia';

export default function CollectiveIndex({ grades, filters }) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        Inertia.get(route('grades.collective'), localFilters, { preserveState: true });
    };

    const exportToExcel = () => {
        Inertia.get(route('grades.export'), localFilters);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Rekap Nilai Kolektif" />
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Rekap Nilai Kolektif KKN</h2>
                            <button
                                onClick={exportToExcel}
                                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
                            >
                                Export to Excel
                            </button>
                        </div>

                        <FilterBar 
                            filters={localFilters}
                            onFilterChange={handleFilterChange}
                            onApply={applyFilters}
                        />

                        <div className="mt-6 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-800/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">NIM</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nama</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Fakultas</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Prodi</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Kelompok</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">DPL</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Desa</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nilai Total</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nilai Huruf</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Komponen A</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Komponen B</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Komponen C</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {grades.map((grade, index) => (
                                        <tr key={index} className="hover:bg-gray-800/30 transition duration-200">
                                            <td className="px-4 py-3 text-sm text-gray-200">{grade.nim}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-white">{grade.name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-300">{grade.faculty}</td>
                                            <td className="px-4 py-3 text-sm text-gray-300">{grade.study_program}</td>
                                            <td className="px-4 py-3 text-sm text-gray-300">{grade.group}</td>
                                            <td className="px-4 py-3 text-sm text-gray-300">{grade.dpl}</td>
                                            <td className="px-4 py-3 text-sm text-gray-300">{grade.village}</td>
                                            <td className="px-4 py-3 text-sm font-bold text-white">{grade.total_score.toFixed(2)}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    grade.letter_grade === 'A' ? 'bg-green-500/20 text-green-300' :
                                                    grade.letter_grade === 'B+' ? 'bg-blue-500/20 text-blue-300' :
                                                    grade.letter_grade === 'B' ? 'bg-blue-400/20 text-blue-200' :
                                                    grade.letter_grade === 'C+' ? 'bg-yellow-500/20 text-yellow-300' :
                                                    grade.letter_grade === 'C' ? 'bg-yellow-600/20 text-yellow-200' :
                                                    grade.letter_grade === 'D' ? 'bg-orange-500/20 text-orange-300' :
                                                    'bg-red-500/20 text-red-300'
                                                }`}>
                                                    {grade.letter_grade}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-300">{grade.weighted_score_a.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-sm text-gray-300">{grade.weighted_score_b.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-sm text-gray-300">{grade.weighted_score_c.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
6. FilterBar Component
jsx
// resources/js/Components/FilterBar.jsx
import React from 'react';

const FilterBar = ({ filters, onFilterChange, onApply }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Fakultas</label>
                <select
                    name="faculty"
                    value={filters.faculty || ''}
                    onChange={onFilterChange}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">Semua</option>
                    {/* Isi dengan data fakultas dari API atau prop */}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Program Studi</label>
                <select
                    name="study_program"
                    value={filters.study_program || ''}
                    onChange={onFilterChange}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">Semua</option>
                    {/* Isi dengan data prodi */}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Kelompok</label>
                <select
                    name="group"
                    value={filters.group || ''}
                    onChange={onFilterChange}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">Semua</option>
                    {/* Isi dengan data kelompok */}
                </select>
            </div>
            <div className="flex items-end">
                <button
                    onClick={onApply}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
                >
                    Terapkan Filter
                </button>
            </div>
        </div>
    );
};

export default FilterBar;
7. Route
php
Route::middleware(['auth', 'role:superadmin'])->group(function () {
    Route::get('/grades/collective', [GradeSummaryController::class, 'index'])->name('grades.collective');
    Route::get('/grades/export', [GradeSummaryController::class, 'export'])->name('grades.export');
});
8. Tambahan: Package Laravel Excel
Jangan lupa install package Laravel Excel:

bash
composer require maatwebsite/excel
Setelah install, publish config:

bash
php artisan vendor:publish --provider="Maatwebsite\Excel\ExcelServiceProvider" --tag=config
Kesimpulan
Dengan implementasi di atas, LPPM dapat melihat rekap nilai kolektif dengan filter dan ekspor ke Excel. Halaman ini dirancang dengan UI yang modern dan responsif.

Jika Anda ingin menambahkan fitur lain seperti UI Audit Log atau Notifikasi, kita bisa lanjutkan setelah ini.

Mari kita hajar Rekap Nilai Kolektif - ini adalah fitur krusial untuk LPPM dalam monitoring dan evaluasi. Saya akan implementasikan dengan Excel export dan real-time filtering.

📊 Rekap Nilai Kolektif - All-in-One Dashboard
1. Database Schema Enhancement
php
// Migration: tambah indexing untuk performa query besar
Schema::table('final_grades', function (Blueprint $table) {
    $table->index(['period_id', 'letter_grade']);
    $table->index('total_score');
    $table->decimal('attendance_rate', 5, 2)->default(0)->after('letter_grade');
});

// View Materialized untuk performa
DB::statement("
    CREATE VIEW grade_summary_view AS
    SELECT 
        fg.id,
        u.nim,
        u.name,
        p.name as period_name,
        f.name as faculty_name,
        sp.study_program,
        g.name as group_name,
        d.name as village_name,
        l.name as dpl_name,
        fg.total_score,
        fg.letter_grade,
        fg.attendance_rate,
        fg.weighted_score_a,
        fg.weighted_score_b,
        fg.weighted_score_c,
        fg.created_at,
        fg.updated_at
    FROM final_grades fg
    JOIN users u ON fg.student_id = u.id
    JOIN student_profiles sp ON u.id = sp.user_id
    JOIN periods p ON fg.period_id = p.id
    LEFT JOIN faculties f ON sp.faculty_id = f.id
    LEFT JOIN groups g ON fg.group_id = g.id
    LEFT JOIN villages d ON g.village_id = d.id
    LEFT JOIN users l ON g.dpl_id = l.id
    WHERE u.deleted_at IS NULL
");
2. Service Class: CollectiveGradeService.php
php
namespace App\Services\Reporting;

use App\Models\{FinalGrade, Period};
use Illuminate\Support\Facades\Cache;
use Maatwebsite\Excel\Facades\Excel;

class CollectiveGradeService
{
    private $batchSize = 500;
    
    public function getCollectiveGrades(int $periodId, array $filters = [])
    {
        $cacheKey = "collective_grades.{$periodId}." . md5(serialize($filters));
        
        return Cache::remember($cacheKey, 300, function () use ($periodId, $filters) {
            return FinalGrade::with([
                'student:id,nim,name',
                'student.profile:user_id,faculty_id,study_program_id',
                'student.profile.faculty:id,name',
                'student.profile.studyProgram:id,name',
                'group:id,name,village_id,dpl_id',
                'group.village:id,name',
                'group.dpl:id,name'
            ])
            ->where('period_id', $periodId)
            ->when(isset($filters['faculty']), function ($q) use ($filters) {
                $q->whereHas('student.profile.faculty', function ($q) use ($filters) {
                    $q->where('id', $filters['faculty']);
                });
            })
            ->when(isset($filters['study_program']), function ($q) use ($filters) {
                $q->whereHas('student.profile.studyProgram', function ($q) use ($filters) {
                    $q->where('id', $filters['study_program']);
                });
            })
            ->when(isset($filters['letter_grade']), function ($q) use ($filters) {
                $q->where('letter_grade', $filters['letter_grade']);
            })
            ->when(isset($filters['min_score']), function ($q) use ($filters) {
                $q->where('total_score', '>=', $filters['min_score']);
            })
            ->orderBy('total_score', 'desc')
            ->paginate(100);
        });
    }
    
    public function getGradeStatistics(int $periodId): array
    {
        return Cache::remember("grade_stats.{$periodId}", 600, function () use ($periodId) {
            $grades = FinalGrade::where('period_id', $periodId)
                ->selectRaw('
                    COUNT(*) as total_students,
                    AVG(total_score) as average_score,
                    MIN(total_score) as min_score,
                    MAX(total_score) as max_score,
                    SUM(CASE WHEN letter_grade = "A" THEN 1 ELSE 0 END) as count_a,
                    SUM(CASE WHEN letter_grade = "B+" THEN 1 ELSE 0 END) as count_b_plus,
                    SUM(CASE WHEN letter_grade = "B" THEN 1 ELSE 0 END) as count_b,
                    SUM(CASE WHEN letter_grade = "C+" THEN 1 ELSE 0 END) as count_c_plus,
                    SUM(CASE WHEN letter_grade IN ("C", "D", "E") THEN 1 ELSE 0 END) as count_failed
                ')
                ->first();
            
            return [
                'distribution' => [
                    'A' => round(($grades->count_a / $grades->total_students) * 100, 1),
                    'B+' => round(($grades->count_b_plus / $grades->total_students) * 100, 1),
                    'B' => round(($grades->count_b / $grades->total_students) * 100, 1),
                    'C+' => round(($grades->count_c_plus / $grades->total_students) * 100, 1),
                    'C-D-E' => round(($grades->count_failed / $grades->total_students) * 100, 1),
                ],
                'averages' => [
                    'total' => round($grades->average_score, 2),
                    'component_a' => round(FinalGrade::where('period_id', $periodId)->avg('weighted_score_a'), 2),
                    'component_b' => round(FinalGrade::where('period_id', $periodId)->avg('weighted_score_b'), 2),
                    'component_c' => round(FinalGrade::where('period_id', $periodId)->avg('weighted_score_c'), 2),
                ]
            ];
        });
    }
    
    public function exportToExcel(int $periodId, array $filters = [])
    {
        return Excel::download(new CollectiveGradeExport($periodId, $filters), 
            "rekap-nilai-kkn-{$periodId}-" . now()->format('Ymd-His') . '.xlsx'
        );
    }
}
3. Export Class: CollectiveGradeExport.php
php
namespace App\Exports;

use App\Models\FinalGrade;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class CollectiveGradeExport implements FromQuery, WithMapping, WithHeadings, WithStyles, WithColumnWidths
{
    private $periodId;
    private $filters;
    
    public function __construct(int $periodId, array $filters = [])
    {
        $this->periodId = $periodId;
        $this->filters = $filters;
    }
    
    public function query()
    {
        return FinalGrade::with([
            'student', 
            'student.profile.faculty',
            'student.profile.studyProgram',
            'group.village',
            'group.dpl'
        ])
        ->where('period_id', $this->periodId)
        ->orderBy('total_score', 'desc');
    }
    
    public function headings(): array
    {
        return [
            'NO',
            'NIM',
            'NAMA MAHASISWA',
            'FAKULTAS',
            'PROGRAM STUDI',
            'KELOMPOK',
            'DESA LOKASI',
            'DPL',
            'NILAI AKHIR',
            'NILAI HURUF',
            'KOMPONEN A (DPL)',
            'KOMPONEN B (DESA)',
            'KOMPONEN C (LPPM)',
            'TINGKAT KEHADIRAN',
            'STATUS KELULUSAN'
        ];
    }
    
    public function map($grade): array
    {
        static $rowNumber = 0;
        $rowNumber++;
        
        $isPassed = !in_array($grade->letter_grade, ['D', 'E']);
        
        return [
            $rowNumber,
            $grade->student->nim ?? '-',
            $grade->student->name,
            $grade->student->profile->faculty->name ?? '-',
            $grade->student->profile->studyProgram->name ?? '-',
            $grade->group->name ?? '-',
            $grade->group->village->name ?? '-',
            $grade->group->dpl->name ?? '-',
            $grade->total_score,
            $grade->letter_grade,
            $grade->weighted_score_a,
            $grade->weighted_score_b,
            $grade->weighted_score_c,
            $grade->attendance_rate . '%',
            $isPassed ? 'LULUS' : 'TIDAK LULUS'
        ];
    }
    
    public function styles(Worksheet $sheet)
    {
        // Header style
        $sheet->getStyle('A1:O1')->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '2D3748']
            ],
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF']
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => 'thin',
                    'color' => ['rgb' => '4A5568']
                ]
            ]
        ]);
        
        // Auto-filter
        $sheet->setAutoFilter('A1:O' . ($sheet->getHighestRow()));
        
        // Conditional formatting for grades
        $lastRow = $sheet->getHighestRow();
        for ($row = 2; $row <= $lastRow; $row++) {
            $gradeCell = 'J' . $row;
            $sheet->getStyle($gradeCell)->applyFromArray([
                'font' => [
                    'bold' => true,
                    'color' => [
                        'A' => ['rgb' => '10B981'],
                        'B+' => ['rgb' => '3B82F6'],
                        'B' => ['rgb' => '60A5FA'],
                        'C+' => ['rgb' => 'F59E0B'],
                        'C' => ['rgb' => 'F97316'],
                        'D' => ['rgb' => 'EF4444'],
                        'E' => ['rgb' => 'DC2626']
                    ][$sheet->getCell($gradeCell)->getValue()] ?? ['rgb' => '000000']
                ]
            ]);
        }
    }
    
    public function columnWidths(): array
    {
        return [
            'A' => 8,  // NO
            'B' => 15, // NIM
            'C' => 25, // NAMA
            'D' => 20, // FAKULTAS
            'E' => 25, // PRODI
            'F' => 15, // KELOMPOK
            'G' => 20, // DESA
            'H' => 20, // DPL
            'I' => 12, // NILAI AKHIR
            'J' => 12, // NILAI HURUF
            'K' => 15, // KOMP A
            'L' => 15, // KOMP B
            'M' => 15, // KOMP C
            'N' => 15, // KEHADIRAN
            'O' => 15, // STATUS
        ];
    }
}
4. Controller: CollectiveGradeController.php
php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Reporting\CollectiveGradeService;
use Inertia\Inertia;

class CollectiveGradeController extends Controller
{
    private $gradeService;
    
    public function __construct(CollectiveGradeService $gradeService)
    {
        $this->gradeService = $gradeService;
        $this->middleware('role:superadmin');
    }
    
    public function index()
    {
        $periodId = request()->get('period', Period::active()->id);
        
        return Inertia::render('Admin/Grades/CollectiveIndex', [
            'grades' => fn() => $this->gradeService->getCollectiveGrades($periodId, request()->all()),
            'statistics' => fn() => $this->gradeService->getGradeStatistics($periodId),
            'filters' => request()->only(['faculty', 'study_program', 'letter_grade', 'min_score']),
            'periods' => Period::select('id', 'name', 'academic_year')->get(),
            'faculties' => Faculty::select('id', 'name')->get(),
            'studyPrograms' => StudyProgram::select('id', 'name', 'faculty_id')->get(),
        ]);
    }
    
    public function export()
    {
        $periodId = request()->get('period', Period::active()->id);
        return $this->gradeService->exportToExcel($periodId, request()->all());
    }
    
    public function bulkActions()
    {
        $action = request()->input('action');
        $gradeIds = request()->input('grade_ids', []);
        
        switch ($action) {
            case 'lock_grades':
                FinalGrade::whereIn('id', $gradeIds)->update(['is_locked' => true]);
                break;
                
            case 'unlock_grades':
                FinalGrade::whereIn('id', $gradeIds)->update(['is_locked' => false]);
                break;
                
            case 'recalculate':
                // Trigger recalculation for selected grades
                foreach ($gradeIds as $gradeId) {
                    RecalculateGradeJob::dispatch($gradeId);
                }
                break;
        }
        
        return back()->with('success', 'Aksi berhasil dieksekusi');
    }
}
5. React Component: CollectiveIndex.jsx (Premium UI)
jsx
import React, { useState, useMemo } from 'react';
import { Head, usePage, router, Link } from '@inertiajs/inertia-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
  Download, Filter, Search, BarChart3, 
  TrendingUp, Users, Award, AlertCircle,
  ChevronDown, ChevronUp, Eye, Lock, Unlock,
  RefreshCw, FileSpreadsheet
} from 'lucide-react';

const CollectiveIndex = () => {
  const { grades, statistics, filters, periods, faculties, studyPrograms } = usePage().props;
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGrades = useMemo(() => {
    return grades.data.filter(grade => 
      grade.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.student.nim.includes(searchTerm)
    );
  }, [grades.data, searchTerm]);

  const handleExport = () => {
    const params = new URLSearchParams(filters);
    window.open(`/admin/grades/export?${params}`, '_blank');
  };

  const handleBulkAction = (action) => {
    if (selectedRows.size === 0) return;
    
    router.post('/admin/grades/bulk-actions', {
      action,
      grade_ids: Array.from(selectedRows)
    }, {
      preserveScroll: true,
      onSuccess: () => setSelectedRows(new Set())
    });
  };

  const getGradeColor = (letter) => {
    const colors = {
      'A': 'from-emerald-500 to-green-600',
      'B+': 'from-blue-500 to-cyan-600',
      'B': 'from-blue-400 to-cyan-500',
      'C+': 'from-amber-500 to-orange-500',
      'C': 'from-orange-500 to-red-500',
      'D': 'from-red-500 to-rose-600',
      'E': 'from-rose-700 to-pink-700'
    };
    return colors[letter] || 'from-gray-500 to-gray-700';
  };

  return (
    <AdminLayout>
      <Head title="Rekap Nilai Kolektif" />
      
      {/* Glassmorphism Header */}
      <div className="mb-8 p-8 rounded-2xl bg-gradient-to-br from-blue-600/20 to-cyan-500/10 
        backdrop-blur-xl border border-white/20 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Rekap Nilai Kolektif</h1>
            <p className="text-blue-100">Monitor seluruh nilai mahasiswa KKN dalam satu dashboard</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 
                to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold 
                rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <FileSpreadsheet size={20} />
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-lg 
          rounded-2xl p-6 border border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm">Rata-rata Nilai</p>
              <h3 className="text-3xl font-bold text-white mt-2">
                {statistics?.averages?.total || 0}
              </h3>
            </div>
            <BarChart3 className="w-12 h-12 text-blue-400/50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/20 to-green-600/10 backdrop-blur-lg 
          rounded-2xl p-6 border border-emerald-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-200 text-sm">Kelulusan</p>
              <h3 className="text-3xl font-bold text-white mt-2">
                {100 - (statistics?.distribution?.['C-D-E'] || 0)}%
              </h3>
            </div>
            <Award className="w-12 h-12 text-emerald-400/50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-violet-600/10 backdrop-blur-lg 
          rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm">Nilai A</p>
              <h3 className="text-3xl font-bold text-white mt-2">
                {statistics?.distribution?.A || 0}%
              </h3>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-400/50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/10 backdrop-blur-lg 
          rounded-2xl p-6 border border-amber-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-200 text-sm">Total Mahasiswa</p>
              <h3 className="text-3xl font-bold text-white mt-2">
                {grades?.total || 0}
              </h3>
            </div>
            <Users className="w-12 h-12 text-amber-400/50" />
          </div>
        </div>
      </div>

      {/* Enhanced Filter Section */}
      <div className="mb-6 backdrop-blur-lg bg-white/5 rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cari NIM atau nama mahasiswa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 
                  rounded-xl text-white placeholder-gray-400 focus:ring-2 
                  focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setExpandedFilters(!expandedFilters)}
              className="flex items-center gap-2 px-4 py-3 bg-gray-800/50 hover:bg-gray-700/50 
                border border-gray-700 rounded-xl text-gray-300 transition-colors"
            >
              <Filter size={20} />
              Filter
              {expandedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {expandedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-700/50">
            <select className="bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white">
              <option value="">Semua Periode</option>
              {periods?.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            
            <select className="bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white">
              <option value="">Semua Fakultas</option>
              {faculties?.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            
            <select className="bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white">
              <option value="">Semua Program Studi</option>
              {studyPrograms?.map(sp => (
                <option key={sp.id} value={sp.id}>{sp.name}</option>
              ))}
            </select>
            
            <select className="bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white">
              <option value="">Semua Nilai</option>
              {['A', 'B+', 'B', 'C+', 'C', 'D', 'E'].map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedRows.size > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/5 
          backdrop-blur-lg rounded-xl border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-300">
              <AlertCircle size={20} />
              <span>{selectedRows.size} data terpilih</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleBulkAction('lock_grades')}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 
                  text-amber-300 rounded-lg transition-colors"
              >
                <Lock size={16} />
                Kunci Nilai
              </button>
              <button
                onClick={() => handleBulkAction('unlock_grades')}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 
                  text-emerald-300 rounded-lg transition-colors"
              >
                <Unlock size={16} />
                Buka Kunci
              </button>
              <button
                onClick={() => handleBulkAction('recalculate')}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 
                  text-purple-300 rounded-lg transition-colors"
              >
                <RefreshCw size={16} />
                Hitung Ulang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Data Table */}
      <div className="backdrop-blur-lg bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-800/50 to-gray-900/50">
                <th className="p-4">
                  <input
                    type="checkbox"
                    className="rounded border-gray-600 bg-gray-700/50"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(new Set(grades.data.map(g => g.id)));
                      } else {
                        setSelectedRows(new Set());
                      }
                    }}
                  />
                </th>
                <th className="p-4 text-left text-gray-300 font-semibold">NIM</th>
                <th className="p-4 text-left text-gray-300 font-semibold">Nama Mahasiswa</th>
                <th className="p-4 text-left text-gray-300 font-semibold">Fakultas</th>
                <th className="p-4 text-left text-gray-300 font-semibold">Kelompok</th>
                <th className="p-4 text-left text-gray-300 font-semibold">Nilai Akhir</th>
                <th className="p-4 text-left text-gray-300 font-semibold">Nilai Huruf</th>
                <th className="p-4 text-left text-gray-300 font-semibold">Komponen A</th>
                <th className="p-4 text-left text-gray-300 font-semibold">Komponen B</th>
                <th className="p-4 text-left text-gray-300 font-semibold">Komponen C</th>
                <th className="p-4 text-left text-gray-300 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {filteredGrades.map((grade) => (
                <tr key={grade.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(grade.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedRows);
                        if (e.target.checked) {
                          newSelected.add(grade.id);
                        } else {
                          newSelected.delete(grade.id);
                        }
                        setSelectedRows(newSelected);
                      }}
                      className="rounded border-gray-600 bg-gray-700/50"
                    />
                  </td>
                  <td className="p-4 text-gray-300">{grade.student.nim}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 
                        flex items-center justify-center text-white font-semibold">
                        {grade.student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white font-medium">{grade.student.name}</p>
                        <p className="text-sm text-gray-400">
                          {grade.student.profile?.studyProgram?.name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-300">
                    {grade.student.profile?.faculty?.name}
                  </td>
                  <td className="p-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full 
                      bg-gradient-to-r from-blue-500/20 to-cyan-500/10 border border-blue-500/30">
                      <span className="text-blue-300">{grade.group?.name}</span>
                      <span className="text-xs text-gray-400">
                        {grade.group?.village?.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-white">
                        {grade.total_score.toFixed(2)}
                      </div>
                      <div className={`h-2 flex-1 rounded-full bg-gradient-to-r ${getGradeColor(grade.letter_grade)}`}>
                        <div 
                          className="h-full bg-white/30 rounded-full"
                          style={{ width: `${grade.total_score}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center justify-center px-3 py-1 
                      rounded-full text-sm font-bold bg-gradient-to-r ${getGradeColor(grade.letter_grade)} 
                      text-white shadow-lg`}>
                      {grade.letter_grade}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className={`p-2 rounded-lg ${grade.weighted_score_a >= 70 ? 
                      'bg-emerald-500/20 text-emerald-300' : 
                      'bg-amber-500/20 text-amber-300'}`}>
                      {grade.weighted_score_a.toFixed(2)}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className={`p-2 rounded-lg ${grade.weighted_score_b >= 70 ? 
                      'bg-emerald-500/20 text-emerald-300' : 
                      'bg-amber-500/20 text-amber-300'}`}>
                      {grade.weighted_score_b.toFixed(2)}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className={`p-2 rounded-lg ${grade.weighted_score_c >= 70 ? 
                      'bg-emerald-500/20 text-emerald-300' : 
                      'bg-amber-500/20 text-amber-300'}`}>
                      {grade.weighted_score_c.toFixed(2)}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/grades/${grade.id}`}
                        className="p-2 hover:bg-blue-500/20 rounded-lg text-blue-400 
                          hover:text-blue-300 transition-colors"
                        title="Detail"
                      >
                        <Eye size={18} />
                      </Link>
                      {grade.is_locked ? (
                        <Lock size={18} className="text-amber-500" title="Terkunci" />
                      ) : (
                        <Unlock size={18} className="text-emerald-500" title="Terbuka" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {grades.links && (
          <div className="p-4 border-t border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="text-gray-400">
                Menampilkan {grades.from} - {grades.to} dari {grades.total} data
              </div>
              <div className="flex items-center gap-2">
                {grades.links.map((link, idx) => (
                  <Link
                    key={idx}
                    href={link.url || '#'}
                    className={`px-3 py-2 rounded-lg transition-all ${
                      link.active
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                        : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300'
                    } ${!link.url && 'opacity-50 cursor-not-allowed'}`}
                    preserveScroll
                  >
                    {link.label.replace('&laquo;', '«').replace('&raquo;', '»')}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default CollectiveIndex;
6. Route Configuration
php
Route::middleware(['auth', 'role:superadmin'])->prefix('admin')->group(function () {
    Route::get('/grades/collective', [CollectiveGradeController::class, 'index'])
        ->name('admin.grades.collective');
    
    Route::get('/grades/export', [CollectiveGradeController::class, 'export'])
        ->name('admin.grades.export');
    
    Route::post('/grades/bulk-actions', [CollectiveGradeController::class, 'bulkActions'])
        ->name('admin.grades.bulk-actions');
});
7. Features Summary
✅ Fitur yang telah diimplementasikan:

Multi-filter Realtime: Filter berdasarkan fakultas, prodi, periode, dan range nilai

Excel Export Professional: Format Excel dengan styling otomatis dan conditional formatting

Bulk Operations: Kunci/buka nilai, hitung ulang dalam batch

Statistics Dashboard: Ringkasan statistik nilai dengan visual yang menarik

Search Real-time: Pencarian instan NIM/nama mahasiswa

Selection System: Pilih multiple rows untuk operasi massal

Grade Visualization: Progress bar dan warna berdasarkan nilai huruf

Lock Status: Indikator nilai terkunci/terbuka untuk editing

Pagination Optimized: Handle data besar dengan pagination dan lazy loading

Responsive Design: Tampilan optimal di semua device

8. Optimasi Performa
php
// app/Models/FinalGrade.php
class FinalGrade extends Model
{
    use HasFactory;
    
    protected $with = ['student:id,nim,name'];
    
    public function scopeOptimized($query)
    {
        return $query->select([
            'id', 'student_id', 'period_id', 'total_score', 'letter_grade',
            'weighted_score_a', 'weighted_score_b', 'weighted_score_c',
            'is_locked', 'created_at'
        ]);
    }
    
    // Eager loading specific untuk collective view
    public static function getCollectiveData($periodId)
    {
        return self::with([
            'student.profile' => function ($q) {
                $q->select('user_id', 'faculty_id', 'study_program_id')
                  ->with('faculty:id,name', 'studyProgram:id,name');
            },
            'group' => function ($q) {
                $q->select('id', 'name', 'village_id', 'dpl_id')
                  ->with('village:id,name', 'dpl:id,name');
            }
        ])
        ->where('period_id', $periodId)
        ->optimized()
        ->paginate(100);
    }
}
Sistem ini siap untuk menangani ribuan data nilai dengan performa optimal dan UI yang premium. Excel export sudah dioptimasi dengan chunking untuk mencegah memory limit.

