<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\Mahasiswa;
use App\Services\GradingService;
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
     * Verify the logged-in DPL is assigned to the given group.
     */
    private function authorizeDplGroup(int $groupId): void
    {
        if (!auth()->user()->hasRole('dpl')) {
            return;
        }

        $dosen = auth()->user()->dosen;
        abort_if(!$dosen, 403, 'Data dosen tidak ditemukan.');

        $groupIds = $dosen->kelompokKkn()->pluck('kelompok_kkn.id');
        abort_if(!$groupIds->contains($groupId), 403, 'Anda tidak memiliki akses ke kelompok ini.');
    }

    public function index(): Response
    {
        $periods = Periode::with('tahunAkademik')->orderByDesc('id')->get()->map(fn($p) => [
            'id' => $p->id,
            'name' => "Angkatan " . ($p->name ?? '-') . " (" . ($p->tahunAkademik?->year ?? '-') . ")",
            'grading_start' => $p->grading_start?->format('Y-m-d'),
            'grading_end' => $p->grading_end?->format('Y-m-d'),
        ]);

        $query = KelompokKkn::with(['lokasi', 'dosen.user:id,name']); // Load pivot 'dosen' instead of just 'dpl'

        // MULTI-DPL LOGIC: Filter groups for logged-in DPL
        if (auth()->user()->hasRole('dpl')) {
            $dosenId = auth()->user()->dosen?->id;
            if ($dosenId) {
                // Show groups where this DPL is assigned AND has 'Ketua' (Admin) role
                $query->whereHas('dosen', function ($q) use ($dosenId) {
                    $q->where('dosen_id', $dosenId)
                      ->where('role', 'Ketua');
                });
            } else {
                // Failsafe: If DPL data not found
                $query->whereRaw('1 = 0');
            }
        }

        $groups = $query->orderBy('code')
            ->get()
            ->map(function (KelompokKkn $g) {
                $addressParts = explode(',', $g->lokasi?->address ?? '');
                $kelompokNum = preg_replace('/[^0-9]/', '', $g->code);
                
                // Get the main DPL name (Ketua)
                $mainDpl = $g->dosen->where('pivot.role', 'Ketua')->first();

                return [
                    'id'         => $g->id,
                    'period_id'  => $g->period_id,
                    'code'       => $kelompokNum,
                    'name'       => "Kelompok " . $kelompokNum,
                    'desa'       => $g->lokasi?->village_name ?? '-',
                    'kecamatan'  => trim($addressParts[0] ?? '-'),
                    'kabupaten'  => trim($addressParts[1] ?? '-'),
                    'dpl'        => $mainDpl?->user?->name ?? '-',
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
        $this->authorizeDplGroup($kelompokKkn->id);

        return response()->json($this->getStudentsForGroup($kelompokKkn));
    }

    /**
     * Fetch students from ALL groups (for 'Semua kelompok' option).
     */
    public function studentsAll()
    {
        // DPL users should not access all groups
        abort_if(auth()->user()->hasRole('dpl'), 403, 'DPL hanya dapat mengakses kelompok yang ditugaskan.');

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
            'evidence_file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'], // Max 5MB
        ]);

        $this->authorizeDplGroup($data['kelompok_id']);

        // ENFORCE GRADING PERIOD for DPL
        if (auth()->user()->hasRole('dpl')) {
            $group = KelompokKkn::with('periode')->find($data['kelompok_id']);
            $period = $group?->periode;
            
            if ($period && $period->grading_start && $period->grading_end) {
                $now = now()->startOfDay();
                if ($now->lt($period->grading_start) || $now->gt($period->grading_end)) {
                    return back()->with('error', 'Masa penilaian KKN untuk periode ini belum dibuka atau sudah berakhir.');
                }
            }
        }

        // Handle File Upload
        $evidencePath = null;
        if ($request->hasFile('evidence_file')) {
            $file = $request->file('evidence_file');
            // Store in: storage/app/public/evidence/{kelompok_id}/{filename}
            $evidencePath = $file->storeAs(
                "evidence/{$data['kelompok_id']}",
                "blanko_" . time() . ".{$file->getClientOriginalExtension()}",
                'public'
            );
        }

        DB::transaction(function () use ($data, $request, $evidencePath) {
            foreach ($data['scores'] as $row) {
                $discipline = $row['discipline'] ?? null;
                $attitude   = $row['attitude'] ?? null;

                if ($discipline === null && $attitude === null && !$evidencePath) {
                    continue;
                }

                $villageWeighted = null;
                if ($discipline !== null && $attitude !== null) {
                    $villageWeighted = round(($discipline + $attitude) / 2, 2);
                }

                $score = NilaiKkn::firstOrNew([
                    'mahasiswa_id' => $row['user_id'],
                    'kelompok_id'  => $data['kelompok_id'],
                ]);

                // Update scores only if provided
                if ($discipline !== null) $score->discipline_score = $discipline;
                if ($attitude !== null) $score->attitude_score = $attitude;
                if ($villageWeighted !== null) $score->village_weighted_score = $villageWeighted;
                
                // Update specific metadata for village grade
                if ($discipline !== null || $attitude !== null) {
                    $score->village_graded_by = $request->user()->id;
                    $score->village_graded_at = now();
                }

                // Update evidence file if uploaded (overwrite existing)
                if ($evidencePath) {
                    $score->evidence_file = $evidencePath;
                }

                // Recalculate total
                $dplWeighted = $score->dpl_weighted_score ?? 0;
                $lppmWeighted = $score->lppm_weighted_score ?? 0;
                $currentVillage = $score->village_weighted_score ?? 0;

                $total = round($dplWeighted + $currentVillage + $lppmWeighted, 2);
                $score->total_score = $total;
                $score->letter_grade = GradingService::determineLetterGrade($total);

                $score->save();
            }
        });

        return back()->with('success', 'Nilai & Bukti Blanko berhasil disimpan.');
    }

    /**
     * Export blanko penilaian as Excel (.xlsx) matching official template.
     */
    public function exportExcel(Request $request, $id)
    {
        $periodId = $request->query('period_id');

        if ($id !== 'all') {
            $this->authorizeDplGroup((int) $id);
        } else {
            abort_if(auth()->user()->hasRole('dpl'), 403, 'DPL hanya dapat mengekspor kelompok yang ditugaskan.');
        }

        if ($id === 'all' && $periodId) {
            $students = $this->getStudentsForPeriod($periodId);
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle("Database Nilai KKN");
            $this->populateSheetBulk($sheet, $students, $periodId);
            
            $filename = "Database_Nilai_KKN_Angkatan_{$periodId}.xlsx";
        } else {
            $kelompokKkn = KelompokKkn::with(['lokasi', 'dpl.user:id,name'])->findOrFail($id);
            $students = $this->getStudentsForGroup($kelompokKkn);
            
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $this->populateSheet($sheet, $kelompokKkn, $students);
            
            $filename = "Blanko_Penilaian_Kelompok_{$kelompokKkn->code}.xlsx";
        }

        $writer = new Xlsx($spreadsheet);
        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'max-age=0',
        ]);
    }

    private function populateSheet($sheet, $kelompokKkn, $students)
    {
        // === HEADER ===
        $sheet->mergeCells('A1:F1');
        $sheet->setCellValue('A1', 'Blanko Penilaian Peserta KKN');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        
        $sheet->mergeCells('A2:F2');
        $sheet->setCellValue('A2', 'Angkatan 57 Tahun 2026');
        $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(12);
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

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
            $sheet->mergeCells("A{$row}:B{$row}");
            $sheet->setCellValue("A{$row}", $label);
            $sheet->setCellValue("C{$row}", ': ' . $value);
            $row++;
        }

        // === TABLE HEADER ===
        $headerRow = 10;
        $headers = ['NO', 'NAMA MAHASISWA', 'NIM', 'DISIPLIN', 'SIKAP', 'TOTAL NILAI'];
        $cols = ['A', 'B', 'C', 'D', 'E', 'F'];
        
        foreach ($headers as $i => $h) {
            $col = $cols[$i];
            $sheet->setCellValue("{$col}{$headerRow}", $h);
            $sheet->getStyle("{$col}{$headerRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("{$col}{$headerRow}")->getFont()->setBold(true);
            $sheet->getStyle("{$col}{$headerRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        }

        // === DATA ROWS ===
        $currentRow = 11;
        foreach ($students as $idx => $student) {
            $sheet->setCellValue("A{$currentRow}", $idx + 1);
            $sheet->getStyle("A{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            
            $sheet->setCellValue("B{$currentRow}", $student['name']);
            
            // Force NIM as string to prevent scientific notation
            $sheet->setCellValueExplicit("C{$currentRow}", $student['nim'], \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
            $sheet->getStyle("C{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            
            if ($student['discipline'] !== null) $sheet->setCellValue("D{$currentRow}", $student['discipline']);
            if ($student['attitude'] !== null) $sheet->setCellValue("E{$currentRow}", $student['attitude']);
            
            if ($student['discipline'] !== null && $student['attitude'] !== null) {
                $total = round(($student['discipline'] + $student['attitude']) / 2);
                $sheet->setCellValue("F{$currentRow}", $total);
            }
            $sheet->getStyle("D{$currentRow}:F{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            
            // Borders for the whole row (A-F)
            $sheet->getStyle("A{$currentRow}:F{$currentRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
            $currentRow++;
        }

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
    }

    public function exportPdf(Request $request, $id)
    {
        $periodId = $request->query('period_id');

        if ($id !== 'all') {
            $this->authorizeDplGroup((int) $id);
        } else {
            abort_if(auth()->user()->hasRole('dpl'), 403, 'DPL hanya dapat mengekspor kelompok yang ditugaskan.');
        }

        if ($id === 'all' && $periodId) {
            $students = $this->getStudentsForPeriod($periodId);
            $period = Periode::with('tahunAkademik')->findOrFail($periodId);
            
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('admin.exports.blanko_nilai_bulk_list', [
                'students' => $students,
                'period_id' => $periodId,
                'angkatan'   => $period->angkatan,
                'tahun'      => $period->tahunAkademik?->year ?? date('Y')
            ]);

            return $pdf->download("Database_Nilai_KKN_Angkatan_{$periodId}.pdf");
        } else {
            $kelompokKkn = KelompokKkn::with(['lokasi', 'dpl.user:id,name', 'periode.tahunAkademik'])->findOrFail($id);
            $students = $this->getStudentsForGroup($kelompokKkn);
            
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('admin.exports.blanko_nilai', [
                'group'    => $kelompokKkn,
                'students' => $students,
                'angkatan' => $kelompokKkn->periode?->angkatan ?? '57',
                'tahun'    => $kelompokKkn->periode?->tahunAkademik?->year ?? date('Y')
            ]);

            return $pdf->download("Blanko_Penilaian_Kelompok_{$kelompokKkn->code}.pdf");
        }
    }

    public function exportZip(Request $request)
    {
        abort_if(auth()->user()->hasRole('dpl'), 403, 'DPL hanya dapat mengekspor kelompok yang ditugaskan.');

        $periodId = $request->query('period_id');
        if (!$periodId) abort(400, 'Missing period_id');

        $groups = KelompokKkn::with(['lokasi', 'dpl.user:id,name'])
            ->where('period_id', $periodId)
            ->orderBy('code')
            ->get();

        $zip = new \ZipArchive();
        $zipFileName = "Separated_Blanko_Penilaian_Periode_{$periodId}.zip";
        $zipPath = storage_path("app/public/{$zipFileName}");

        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === TRUE) {
            $period = Periode::with('tahunAkademik')->findOrFail($periodId);
            foreach ($groups as $group) {
                $students = $this->getStudentsForGroup($group);
                $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('admin.exports.blanko_nilai', [
                    'group'    => $group,
                    'students' => $students,
                    'angkatan' => $period->angkatan,
                    'tahun'    => $period->tahunAkademik?->year ?? date('Y')
                ]);
                
                $pdfName = "Blanko_Penilaian_Kelompok_{$group->code}.pdf";
                $zip->addFromString($pdfName, $pdf->output());
            }
            $zip->close();
        }

        return response()->download($zipPath)->deleteFileAfterSend(true);
    }



    private function getStudentsForGroup($group): array
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
        $hasAnggotaTable = \Illuminate\Support\Facades\Cache::remember('has_anggota_kelompok_table', 3600, fn() => \Illuminate\Support\Facades\Schema::hasTable('anggota_kelompok'));
        if ($hasAnggotaTable) {
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

    /**
     * Helper: get all students for a period.
     */
    private function getStudentsForPeriod($periodId): array
    {
        return DB::table('mahasiswa as s')
            ->join('users as u', 's.user_id', '=', 'u.id')
            ->join('peserta_kkn as r', 's.id', '=', 'r.mahasiswa_id')
            ->join('kelompok_kkn as g', 'r.kelompok_id', '=', 'g.id')
            ->leftJoin('nilai_kkn as ks', function ($join) {
                $join->on('ks.mahasiswa_id', '=', 'u.id')
                     ->on('ks.kelompok_id', '=', 'g.id');
            })
            ->where('g.period_id', $periodId)
            ->select([
                'u.id as user_id',
                'u.name',
                's.nim',
                'g.code as group_code',
                'ks.discipline_score as discipline',
                'ks.attitude_score as attitude',
            ])
            ->orderBy('g.code')
            ->orderBy('u.name')
            ->get()
            ->map(fn($s) => [
                'user_id'    => $s->user_id,
                'name'       => $s->name,
                'nim'        => $s->nim,
                'group_code' => $s->group_code,
                'discipline' => $s->discipline ? (int)$s->discipline : null,
                'attitude'   => $s->attitude ? (int)$s->attitude : null,
            ])
            ->toArray();
    }

    private function populateSheetBulk($sheet, $students, $periodId)
    {
        // === HEADER ===
        $sheet->mergeCells('A1:G1');
        $sheet->setCellValue('A1', 'DATABASE NILAI KKN');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        
        $sheet->mergeCells('A2:G2');
        $sheet->setCellValue('A2', 'Angkatan ' . ($periodId ?? '57') . ' Tahun 2026');
        $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(12);
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // === TABLE HEADER ===
        $headerRow = 5;
        $headers = ['NO', 'KELOMPOK', 'NAMA MAHASISWA', 'NIM', 'DISIPLIN', 'SIKAP', 'TOTAL NILAI'];
        $cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        
        foreach ($headers as $i => $h) {
            $col = $cols[$i];
            $sheet->setCellValue("{$col}{$headerRow}", $h);
            $sheet->getStyle("{$col}{$headerRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("{$col}{$headerRow}")->getFont()->setBold(true);
            $sheet->getStyle("{$col}{$headerRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        }

        // === DATA ROWS ===
        $currentRow = 6;
        foreach ($students as $idx => $student) {
            $sheet->setCellValue("A{$currentRow}", $idx + 1);
            $sheet->setCellValue("B{$currentRow}", $student['group_code']);
            $sheet->setCellValue("C{$currentRow}", $student['name']);
            
            // Force NIM as string
            $sheet->setCellValueExplicit("D{$currentRow}", $student['nim'], \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
            
            $sheet->setCellValue("E{$currentRow}", $student['discipline']);
            $sheet->setCellValue("F{$currentRow}", $student['attitude']);
            
            if ($student['discipline'] !== null && $student['attitude'] !== null) {
                $total = round(($student['discipline'] + $student['attitude']) / 2);
                $sheet->setCellValue("G{$currentRow}", $total);
            }

            $sheet->getStyle("A{$currentRow}:G{$currentRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
            $sheet->getStyle("A{$currentRow}:B{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("D{$currentRow}:G{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $currentRow++;
        }

        // === COLUMN WIDTHS ===
        $sheet->getColumnDimension('A')->setWidth(5);
        $sheet->getColumnDimension('B')->setWidth(15);
        $sheet->getColumnDimension('C')->setWidth(40);
        $sheet->getColumnDimension('D')->setWidth(20);
        $sheet->getColumnDimension('E')->setWidth(12);
        $sheet->getColumnDimension('F')->setWidth(12);
        $sheet->getColumnDimension('G')->setWidth(12);
    }
}
