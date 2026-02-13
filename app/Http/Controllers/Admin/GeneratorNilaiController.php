<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Periode;
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
    public function index(): Response
    {
        $periods = Periode::with('tahunAkademik')->orderByDesc('id')->get()->map(fn($p) => [
            'id' => $p->id,
            'name' => "Angkatan " . ($p->name ?? '-') . " (" . ($p->tahunAkademik?->year ?? '-') . ")",
        ]);

        $groups = KelompokKkn::with(['lokasi', 'dpl.user:id,name'])
            ->orderBy('code')
            ->get()
            ->map(function (KelompokKkn $g) {
                $addressParts = explode(',', $g->lokasi?->address ?? '');
                $kelompokNum = preg_replace('/[^0-9]/', '', $g->code);
                return [
                    'id'         => $g->id,
                    'period_id'  => $g->period_id,
                    'code'       => $kelompokNum,
                    'name'       => "Kelompok " . $kelompokNum,
                    'desa'       => $g->lokasi?->village_name ?? '-',
                    'kecamatan'  => trim($addressParts[0] ?? '-'),
                    'kabupaten'  => trim($addressParts[1] ?? '-'),
                    'dpl'        => $g->dpl?->user?->name ?? '-',
                ];
            });

        return Inertia::render('Admin/GradeGenerator/Index', [
            'periods' => $periods,
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
        $kelompokKkn->load(['lokasi', 'dpl.user:id,name']);
        $students = $this->getStudentsForGroup($kelompokKkn);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Sheet1');

        // === HEADER ===
        $sheet->setCellValue('A1', 'Blanko Penilaian Peserta KKN');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        
        $sheet->setCellValue('A2', 'Angkatan 57 Tahun 2026');
        $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(12);

        // === META DATA ===
        $addressParts = explode(',', $kelompokKkn->lokasi?->address ?? '');
        $meta = [
            'KELOMPOK'  => preg_replace('/[^0-9]/', '', $kelompokKkn->code),
            'DESA'      => $kelompokKkn->lokasi?->village_name ?? '-',
            'KECAMATAN' => trim($addressParts[0] ?? '-'),
            'KABUPATEN' => trim($addressParts[1] ?? '-'),
            'DPL'       => $kelompokKkn->dpl?->user?->name ?? '-',
        ];

        $row = 4;
        foreach ($meta as $label => $value) {
            $sheet->setCellValue("A{$row}", $label);
            $sheet->setCellValue("B{$row}", ':');
            $sheet->setCellValue("C{$row}", $value);
            $row++;
        }

        // === TABLE HEADER ===
        $headerRow = 10;
        $headers = ['NO', 'NAMA MAHASISWA', 'NIM', 'DISIPLIN', 'SIKAP', 'TOTAL (B)'];
        $cols = ['A', 'B', 'C', 'D', 'E', 'F'];
        
        foreach ($headers as $i => $h) {
            $col = $cols[$i];
            $sheet->setCellValue("{$col}{$headerRow}", $h);
            $sheet->getStyle("{$col}{$headerRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("{$col}{$headerRow}")->getFont()->setBold(true);
        }

        // === DATA ROWS ===
        $startRow = 11;
        $currentRow = $startRow;
        
        // Ensure 15 rows
        for ($i = 0; $i < 15; $i++) {
            $student = $students[$i] ?? null;
            $sheet->setCellValue("A{$currentRow}", $i + 1);
            $sheet->getStyle("A{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            
            if ($student) {
                $sheet->setCellValue("B{$currentRow}", $student['name']);
                $sheet->setCellValue("C{$currentRow}", $student['nim']);
                $sheet->getStyle("C{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                
                if ($student['discipline'] !== null) $sheet->setCellValue("D{$currentRow}", $student['discipline']);
                if ($student['attitude'] !== null) $sheet->setCellValue("E{$currentRow}", $student['attitude']);
                
                if ($student['discipline'] !== null && $student['attitude'] !== null) {
                    $total = round(($student['discipline'] + $student['attitude']) / 2);
                    $sheet->setCellValue("F{$currentRow}", $total);
                }
                $sheet->getStyle("D{$currentRow}:F{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            }
            
            // Borders for the whole row (A-F)
            $sheet->getStyle("A{$currentRow}:F{$currentRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
            $currentRow++;
        }
        
        // Border for header
        $sheet->getStyle("A10:F10")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

        // === FOOTER ===
        $footerStartRow = $currentRow + 1;
        $sheet->setCellValue("A{$footerStartRow}", '*Keterangan:');
        $sheet->getStyle("A{$footerStartRow}")->getFont()->setItalic(true)->setSize(9);
        $sheet->setCellValue("A" . ($footerStartRow + 1), "- Rentang Nilai 60-100");
        $sheet->getStyle("A" . ($footerStartRow + 1))->getFont()->setItalic(true)->setSize(9);

        // Signature block on the right
        $sigCol = 'D';
        $sheet->setCellValue("{$sigCol}{$footerStartRow}", ".........................., .............................. 2026");
        $sheet->getStyle("{$sigCol}{$footerStartRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
        
        $sheet->setCellValue("{$sigCol}" . ($footerStartRow + 1), "Kepala Desa/Lurah,");
        
        $sheet->setCellValue("{$sigCol}" . ($footerStartRow + 5), ".........................................................");
        $sheet->setCellValue("{$sigCol}" . ($footerStartRow + 6), "NIP.");

        // === COLUMN WIDTHS ===
        $sheet->getColumnDimension('A')->setWidth(5);
        $sheet->getColumnDimension('B')->setWidth(45);
        $sheet->getColumnDimension('C')->setWidth(20);
        $sheet->getColumnDimension('D')->setWidth(15);
        $sheet->getColumnDimension('E')->setWidth(15);
        $sheet->getColumnDimension('F')->setWidth(15);

        // Response
        $filename = "Blanko_Penilaian_Kelompok_{$kelompokKkn->code}.xlsx";
        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'max-age=0',
        ]);
    }

    public function exportPdf(KelompokKkn $kelompokKkn)
    {
        $kelompokKkn->load(['lokasi', 'dpl.user:id,name']);
        $students = $this->getStudentsForGroup($kelompokKkn);
        
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('admin.exports.blanko_nilai', [
            'group'    => $kelompokKkn,
            'students' => $students,
            'angkatan' => '57',
            'tahun'    => '2026'
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
