<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\DB;

/**
 * ComprehensiveReportService — generate executive summary PDF lengkap untuk LP2M.
 *
 * Output: 1 PDF multi-section berisi:
 *   1. Cover page (judul periode, UIN SAIZU, tanggal cetak)
 *   2. Executive summary (total mahasiswa, kelompok, DPL, rata-rata nilai, grade distribution)
 *   3. Rekap per fakultas (mahasiswa count, pass rate, avg grade)
 *   4. Rekap per kelompok (location, DPL, member count, avg grade, status laporan)
 *   5. Top 10 mahasiswa (best grades)
 *   6. Mahasiswa at-risk (below 70 / belum submit laporan)
 *   7. Statistik laporan harian (total submitted/approved/revision)
 *   8. Statistik kegiatan (program kerja + poster)
 *
 * Dipakai via:
 *   Route::get('/admin/report/comprehensive/{periode}')
 *
 * Penting: `nilai_kkn` TIDAK punya kolom `periode_id` — filter periode dilakukan
 * via `kelompok_kkn.periode_id`. Kolom skor final = `total_score` (bukan final_score).
 */
class ComprehensiveReportService
{
    public function generateForPeriode(int $periodeId): \Barryvdh\DomPDF\PDF
    {
        $periode = Periode::with('tahunAkademik', 'jenisKkn')->findOrFail($periodeId);

        $data = [
            'periode' => $periode,
            'generated_at' => now(),
            'summary' => $this->computeSummary($periodeId),
            'by_faculty' => $this->computeByFaculty($periodeId),
            'by_group' => $this->computeByGroup($periodeId),
            'top_students' => $this->getTopStudents($periodeId, 10),
            'at_risk' => $this->getAtRiskStudents($periodeId),
            'daily_report_stats' => $this->computeDailyReportStats($periodeId),
            'work_program_stats' => $this->computeWorkProgramStats($periodeId),
        ];

        return Pdf::loadView('pdf.comprehensive-report', $data)
            ->setPaper('A4', 'portrait')
            ->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => false,
                'defaultFont' => 'DejaVu Sans',
            ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function computeSummary(int $periodeId): array
    {
        $totalMahasiswa = PesertaKkn::where('periode_id', $periodeId)->count();
        $totalDitempatkan = PesertaKkn::where('periode_id', $periodeId)->whereNotNull('kelompok_id')->count();
        $totalKelompok = KelompokKkn::where('periode_id', $periodeId)->count();

        $groupIds = KelompokKkn::where('periode_id', $periodeId)->pluck('id');

        $grades = NilaiKkn::whereIn('kelompok_id', $groupIds)->get(['total_score', 'letter_grade']);
        $totalScores = $grades->pluck('total_score')->filter(fn ($s) => $s !== null);
        $avgGrade = $totalScores->count() > 0 ? round((float) $totalScores->avg(), 2) : 0;

        // Grade distribution
        $distribution = ['A' => 0, 'B' => 0, 'C' => 0, 'D' => 0, 'E' => 0];
        foreach ($grades as $g) {
            $raw = (string) ($g->letter_grade ?? '');
            if ($raw === '') {
                continue;
            }
            $letter = strtoupper($raw[0]);
            if (isset($distribution[$letter])) {
                $distribution[$letter]++;
            }
        }

        // DPL count — via dpl_periode (pivot dosen_id × periode_id)
        $totalDpl = DB::table('dpl_periode')
            ->where('periode_id', $periodeId)
            ->distinct()
            ->count('dosen_id');

        $passCount = $grades->filter(fn ($g) => in_array($g->letter_grade, ['A', 'B', 'C'], true))->count();

        return [
            'total_mahasiswa' => $totalMahasiswa,
            'total_ditempatkan' => $totalDitempatkan,
            'total_kelompok' => $totalKelompok,
            'total_dpl' => $totalDpl,
            'average_grade' => $avgGrade,
            'graded_count' => $totalScores->count(),
            'grade_distribution' => $distribution,
            'pass_rate' => $grades->count() > 0 ? round($passCount / $grades->count() * 100, 1) : 0,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function computeByFaculty(int $periodeId): array
    {
        return DB::table('peserta_kkn as pk')
            ->join('mahasiswa as m', 'pk.mahasiswa_id', '=', 'm.id')
            ->leftJoin('fakultas as f', 'm.fakultas_id', '=', 'f.id')
            ->leftJoin('nilai_kkn as nk', 'nk.user_id', '=', 'm.user_id')
            ->leftJoin('kelompok_kkn as k_nk', function ($j) use ($periodeId) {
                $j->on('k_nk.id', '=', 'nk.kelompok_id')->where('k_nk.periode_id', $periodeId);
            })
            ->where('pk.periode_id', $periodeId)
            ->select(
                DB::raw("COALESCE(f.nama, '(Tidak Diketahui)') as faculty"),
                DB::raw('COUNT(DISTINCT pk.id) as student_count'),
                DB::raw("COUNT(DISTINCT CASE WHEN nk.letter_grade IN ('A','B','C') AND k_nk.id IS NOT NULL THEN pk.id END) as pass_count"),
                DB::raw('ROUND(AVG(CASE WHEN k_nk.id IS NOT NULL THEN nk.total_score END)::numeric, 2) as avg_grade')
            )
            ->groupBy('f.nama')
            ->orderByDesc('student_count')
            ->get()
            ->map(fn ($r) => [
                'faculty' => $r->faculty,
                'student_count' => (int) $r->student_count,
                'pass_count' => (int) $r->pass_count,
                'pass_rate' => $r->student_count > 0 ? round($r->pass_count / $r->student_count * 100, 1) : 0,
                'avg_grade' => $r->avg_grade ? (float) $r->avg_grade : 0,
            ])
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function computeByGroup(int $periodeId): array
    {
        return KelompokKkn::where('periode_id', $periodeId)
            ->with(['lokasi'])
            ->withCount(['peserta as member_count'])
            ->get()
            ->map(function (KelompokKkn $k) {
                $avgGrade = NilaiKkn::where('kelompok_id', $k->id)->avg('total_score');

                return [
                    'code' => $k->code ?? '-',
                    'name' => $k->nama_kelompok ?? '-',
                    'location' => $k->lokasi?->district_name ?? '-',
                    'village' => $k->lokasi?->village_name ?? '-',
                    'member_count' => (int) $k->member_count,
                    'avg_grade' => $avgGrade ? round((float) $avgGrade, 2) : null,
                ];
            })
            ->sortBy('code')
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function getTopStudents(int $periodeId, int $limit = 10): array
    {
        return DB::table('nilai_kkn as nk')
            ->join('users as u', 'nk.user_id', '=', 'u.id')
            ->leftJoin('mahasiswa as m', 'm.user_id', '=', 'u.id')
            ->join('kelompok_kkn as k', 'nk.kelompok_id', '=', 'k.id')
            ->where('k.periode_id', $periodeId)
            ->whereNotNull('nk.total_score')
            ->orderByDesc('nk.total_score')
            ->limit($limit)
            ->select(
                'u.name',
                'm.nim',
                'nk.total_score',
                'nk.letter_grade',
                'k.code as group_code',
                'k.nama_kelompok as group_name'
            )
            ->get()
            ->map(fn ($r) => [
                'name' => $r->name,
                'nim' => $r->nim ?? '-',
                'total_score' => (float) $r->total_score,
                'letter_grade' => $r->letter_grade ?? '-',
                'group' => $r->group_code ?? '-',
            ])
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function getAtRiskStudents(int $periodeId): array
    {
        return DB::table('nilai_kkn as nk')
            ->join('users as u', 'nk.user_id', '=', 'u.id')
            ->leftJoin('mahasiswa as m', 'm.user_id', '=', 'u.id')
            ->join('kelompok_kkn as k', 'nk.kelompok_id', '=', 'k.id')
            ->where('k.periode_id', $periodeId)
            ->whereNotNull('nk.total_score')
            ->where('nk.total_score', '<', 70)
            ->orderBy('nk.total_score')
            ->limit(20)
            ->select(
                'u.name',
                'm.nim',
                'nk.total_score',
                'nk.letter_grade',
                'k.code as group_code'
            )
            ->get()
            ->map(fn ($r) => [
                'name' => $r->name,
                'nim' => $r->nim ?? '-',
                'total_score' => (float) $r->total_score,
                'letter_grade' => $r->letter_grade ?? '-',
                'group' => $r->group_code ?? '-',
            ])
            ->all();
    }

    /**
     * @return array<string, int>
     */
    private function computeDailyReportStats(int $periodeId): array
    {
        $groupIds = KelompokKkn::where('periode_id', $periodeId)->pluck('id');

        if ($groupIds->isEmpty()) {
            return ['total' => 0, 'approved' => 0, 'pending' => 0, 'revision' => 0];
        }

        $base = DB::table('kegiatan_kkn')->whereIn('kelompok_id', $groupIds);

        return [
            'total' => (clone $base)->count(),
            'approved' => (clone $base)->where('status', 'approved')->count(),
            'pending' => (clone $base)->whereIn('status', ['submitted', 'draft'])->count(),
            'revision' => (clone $base)->where('status', 'revision')->count(),
        ];
    }

    /**
     * @return array<string, int>
     */
    private function computeWorkProgramStats(int $periodeId): array
    {
        $groupIds = KelompokKkn::where('periode_id', $periodeId)->pluck('id');

        if ($groupIds->isEmpty()) {
            return ['total' => 0, 'approved' => 0, 'pending' => 0];
        }

        $base = DB::table('program_kerja')->whereIn('kelompok_id', $groupIds);

        return [
            'total' => (clone $base)->count(),
            'approved' => (clone $base)->where('status', 'approved')->count(),
            'pending' => (clone $base)->whereIn('status', ['submitted', 'draft'])->count(),
        ];
    }
}
