<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\Mahasiswa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Font;
use Symfony\Component\HttpFoundation\StreamedResponse;

class GeneratorNilaiController extends Controller
{
    /**
     * Display the grade generator / blanko penilaian page.
     */
    public function index(): Response
    {
        $groups = KelompokKkn::with(['lokasi', 'dpl.user:id,name'])
            ->orderBy('code')
            ->get()
            ->map(fn(KelompokKkn $g) => [
                'id'         => $g->id,
                'code'       => $g->code,
                'name'       => $g->nama_kelompok,
                'desa'       => $g->lokasi?->village_name ?? '-',
                'kecamatan'  => $g->lokasi?->address ?? '-',
                'kabupaten'  => '-',
                'dpl'        => $g->dpl?->user?->name ?? '-',
            ]);

        return Inertia::render('Admin/GradeGenerator/Index', [
            'groups' => $groups,
        ]);
    }

    /**
     * Fetch students of a given group with their existing village scores.
     */
    public function students(KelompokKkn $kelompokKkn)
    {
        return response()->json($this->getStudentsForGroup($kelompokKkn));
    }

    /**
     * Fetch students from ALL groups (for 'Semua kelompok' option).
     */
    public function studentsAll()
    {
        $allStudents = [];
        $groups = KelompokKkn::orderBy('code')->get();

        foreach ($groups as $group) {
            $groupStudents = $this->getStudentsForGroup($group);
            foreach ($groupStudents as &$s) {
                $s['group_code'] = $group->code;
                $s['group_name'] = $group->nama_kelompok;
            }
            $allStudents = array_merge($allStudents, $groupStudents);
        }

        return response()->json($allStudents);
    }

    /**
     * Save village head scores (discipline + attitude) for multiple students.
     */
    public function saveScores(Request $request)
    {
        $data = $request->validate([
            'kelompok_id' => ['required', 'exists:kelompok_kkn,id'],
            'scores'   => ['required', 'array'],
            'scores.*.user_id'    => ['required', 'exists:users,id'],
            'scores.*.discipline' => ['nullable', 'numeric', 'between:0,100'],
            'scores.*.attitude'   => ['nullable', 'numeric', 'between:0,100'],
        ]);

        DB::transaction(function () use ($data, $request) {
            foreach ($data['scores'] as $row) {
                $discipline = $row['discipline'] ?? null;
                $attitude   = $row['attitude'] ?? null;

                if ($discipline === null && $attitude === null) {
                    continue;
                }

                $villageWeighted = null;
                if ($discipline !== null && $attitude !== null) {
                    $villageWeighted = round(($discipline + $attitude) / 2, 2);
                }

                $score = NilaiKkn::firstOrNew([
                    'mahasiswa_id' => $row['user_id'],
                    'kelompok_id'   => $data['kelompok_id'],
                ]);

                $score->discipline_score     = $discipline;
                $score->attitude_score       = $attitude;
                $score->village_weighted_score = $villageWeighted;
                $score->village_graded_by    = $request->user()->id;
                $score->village_graded_at    = now();

                // Recalculate total if DPL scores exist
                $dplWeighted = $score->dpl_weighted_score ?? 0;
                $lppmWeighted = $score->lppm_weighted_score ?? 0;
                $total = round($dplWeighted + ($villageWeighted ?? 0) + $lppmWeighted, 2);
                $score->total_score = $total;

                if ($total >= 85)      $score->letter_grade = 'A';
                elseif ($total >= 75)  $score->letter_grade = 'B';
                elseif ($total >= 65)  $score->letter_grade = 'C';
                else                   $score->letter_grade = 'D';

                $score->save();
            }
        });

        return back()->with('success', 'Nilai kedisiplinan & sikap berhasil disimpan.');
    }

    /**
     * Export blanko penilaian as Excel (.xlsx) matching official template.
     */
    public function exportExcel(KelompokKkn $kelompokKkn)
    {
        $students = $this->getStudentsForGroup($kelompokKkn);
        $filename = "Blanko_Penilaian_Kelompok_{$kelompokKkn->code}.xlsx";

        return \Maatwebsite\Excel\Facades\Excel::download(new class($kelompokKkn, $students) implements \Maatwebsite\Excel\Concerns\FromView, \Maatwebsite\Excel\Concerns\ShouldAutoSize {
            private $group;
            private $students;

            public function __construct($group, $students)
            {
                $this->group = $group;
                $this->students = $students;
            }

            public function view(): \Illuminate\Contracts\View\View
            {
                return view('admin.exports.blanko_nilai', [
                    'group' => $this->group,
                    'students' => $this->students,
                    'angkatan' => '57', // Fallback or dynamic
                    'tahun' => '2026'
                ]);
            }
        }, $filename);
    }

    public function exportPdf(KelompokKkn $kelompokKkn)
    {
        $students = $this->getStudentsForGroup($kelompokKkn);
        
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('admin.exports.blanko_nilai', [
            'group' => $kelompokKkn,
            'students' => $students,
            'angkatan' => '57',
            'tahun' => '2026'
        ]);

        return $pdf->download("Blanko_Penilaian_Kelompok_{$kelompokKkn->code}.pdf");
    }


    /**
     * Helper: get students for a group (from registrations or group_members).
     */
    private function getStudentsForGroup(KelompokKkn $group): array
    {
        // Fetch all registrations for this group (no status filter)
        $registrations = PesertaKkn::with(['mahasiswa:id,user_id,nim,nama'])
            ->where('kelompok_id', $group->id)
            ->get();

        if ($registrations->isNotEmpty()) {
            return $registrations->map(function ($reg) use ($group) {
                $userId = $reg->mahasiswa->user_id;
                $score = NilaiKkn::where('mahasiswa_id', $userId)
                    ->where('kelompok_id', $group->id)->first();
                return [
                    'user_id'    => $userId,
                    'name'       => $reg->mahasiswa->nama,
                    'nim'        => $reg->mahasiswa->nim,
                    'discipline' => $score?->discipline_score ? (int)$score->discipline_score : null,
                    'attitude'   => $score?->attitude_score ? (int)$score->attitude_score : null,
                ];
            })->values()->toArray();
        }

        // Fallback to anggota_kelompok table
        if (\Illuminate\Support\Facades\Schema::hasTable('anggota_kelompok')) {
            $members = DB::table('anggota_kelompok')
                ->join('mahasiswa', 'anggota_kelompok.mahasiswa_id', '=', 'mahasiswa.id')
                ->join('users', 'mahasiswa.user_id', '=', 'users.id')
                ->where('anggota_kelompok.kelompok_id', $group->id)
                ->select('mahasiswa.id', 'users.id as user_id', 'mahasiswa.nim', 'mahasiswa.nama', 'users.name as user_name')
                ->get();

            return $members->map(function ($m) use ($group) {
                $score = NilaiKkn::where('mahasiswa_id', $m->user_id)
                    ->where('kelompok_id', $group->id)->first();
                return [
                    'user_id'    => $m->user_id,
                    'name'       => $m->nama ?: $m->user_name,
                    'nim'        => $m->nim,
                    'discipline' => $score?->discipline_score ? (int)$score->discipline_score : null,
                    'attitude'   => $score?->attitude_score ? (int)$score->attitude_score : null,
                ];
            })->values()->toArray();
        }

        return [];
    }
}
