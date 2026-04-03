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
    public function __construct(
        private GradingService $gradingService
    ) {}

    /**
     * Verify the logged-in DPL is assigned to the given group as Ketua.
     */
    private function authorizeDplGroup(int $groupId): void
    {
        if (!auth()->user()->hasRole('dpl')) {
            return;
        }

        $dosen = auth()->user()->dosen;
        abort_if(!$dosen, 403, 'Data profil dosen tidak ditemukan.');

        $isAssigned = $dosen->kelompokKkn()
            ->where('kelompok_kkn.id', $groupId)
            ->wherePivot('role', 'Ketua')
            ->exists();

        abort_if(!$isAssigned, 403, 'Akses Ditolak: Anda harus menjadi Ketua DPL untuk kelompok ini agar dapat memberikan nilai.');
    }

    public function index(): Response
    {
        $periods = Periode::with('tahunAkademik')->orderByDesc('id')->get()->map(fn($p) => [
            'id' => $p->id,
            'name' => "Angkatan " . ($p->name ?? '-') . " (" . ($p->tahunAkademik?->year ?? '-') . ")",
            'grading_start' => $p->grading_start?->format('Y-m-d'),
            'grading_end' => $p->grading_end?->format('Y-m-d'),
        ]);

        $query = KelompokKkn::with(['lokasi', 'dosen.user:id,name']);

        // MULTI-DPL LOGIC: Filter groups for logged-in DPL
        if (auth()->user()->hasRole('dpl')) {
            $dosenId = auth()->user()->dosen?->id;
            if ($dosenId) {
                $query->whereHas('dosen', function ($q) use ($dosenId) {
                    $q->where('dosen_id', $dosenId)
                      ->where('role', 'Ketua');
                });
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        $groups = $query->orderBy('code')
            ->get()
            ->map(function (KelompokKkn $g) {
                $addressParts = explode(',', $g->lokasi?->address ?? '');
                $kelompokNum = preg_replace('/[^0-9]/', '', $g->code);
                
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

    public function students(KelompokKkn $kelompokKkn)
    {
        $this->authorizeDplGroup($kelompokKkn->id);
        return response()->json($this->getStudentsForGroup($kelompokKkn));
    }

    public function studentsAll()
    {
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

    public function saveScores(Request $request)
    {
        $data = $request->validate([
            'kelompok_id' => ['required', 'exists:kelompok_kkn,id'],
            'scores'   => ['required', 'array'],
            'scores.*.user_id'    => ['required', 'exists:users,id'],
            'scores.*.discipline' => ['nullable', 'numeric', 'between:0,100'],
            'scores.*.attitude'   => ['nullable', 'numeric', 'between:0,100'],
            'evidence_file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        $this->authorizeDplGroup($data['kelompok_id']);

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

        // Handle File Upload - PROTECTED STORAGE
        $evidencePath = null;
        if ($request->hasFile('evidence_file')) {
            $file = $request->file('evidence_file');
            // Store in private storage (local disk) for security
            $evidencePath = $file->storeAs(
                "evidence/{$data['kelompok_id']}",
                "blanko_" . time() . ".{$file->getClientOriginalExtension()}"
            );
        }

        DB::transaction(function () use ($data, $request, $evidencePath) {
            foreach ($data['scores'] as $row) {
                $discipline = $row['discipline'] ?? null;
                $attitude   = $row['attitude'] ?? null;

                if ($discipline === null && $attitude === null && !$evidencePath) {
                    continue;
                }

                $score = NilaiKkn::firstOrNew([
                    'user_id' => $row['user_id'],
                    'kelompok_id'  => $data['kelompok_id'],
                ]);

                if ($discipline !== null) $score->discipline_score = $discipline;
                if ($attitude !== null) $score->attitude_score = $attitude;

                if ($discipline !== null || $attitude !== null) {
                    $score->dpl_graded_by = $request->user()->id;
                    $score->dpl_graded_at = now();
                }

                if ($evidencePath) {
                    $score->evidence_file = $evidencePath;
                }

                $score->save();

                // Recalculate everything safely using Service
                $this->gradingService->calculateFinalGrade($score);
            }
        });

        return back()->with('success', 'Nilai & Bukti Blanko berhasil disimpan.');
    }

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
            $kelompokKkn = KelompokKkn::with(['lokasi', 'dosen.user:id,name', 'periode.tahunAkademik'])->findOrFail($id);
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
        $sheet->setCellValue('A2', 'Angkatan ' . ($kelompokKkn->periode?->name ?? '57') . ' Tahun ' . ($kelompokKkn->periode?->tahunAkademik?->year ?? date('Y')));
        $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(12);
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $mainDpl = $kelompokKkn->dosen->where('pivot.role', 'Ketua')->first();

        // === META DATA ===
        $addressParts = explode(',', $kelompokKkn->lokasi?->address ?? '');
        $meta = [
            'KELOMPOK'  => preg_replace('/[^0-9]/', '', $kelompokKkn->code),
            'DESA'      => $kelompokKkn->lokasi?->village_name ?? '-',
            'KECAMATAN' => trim($addressParts[0] ?? '-'),
            'KABUPATEN' => trim($addressParts[1] ?? '-'),
            'DPL'       => $mainDpl?->user?->name ?? '-',
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

        $currentRow = 11;
        foreach ($students as $idx => $student) {
            $sheet->setCellValue("A{$currentRow}", $idx + 1);
            $sheet->setCellValue("B{$currentRow}", $student['name']);
            $sheet->setCellValueExplicit("C{$currentRow}", $student['nim'], \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
            
            if ($student['discipline'] !== null) $sheet->setCellValue("D{$currentRow}", $student['discipline']);
            if ($student['attitude'] !== null) $sheet->setCellValue("E{$currentRow}", $student['attitude']);
            
            if ($student['discipline'] !== null && $student['attitude'] !== null) {
                $total = round(($student['discipline'] + $student['attitude']) / 2);
                $sheet->setCellValue("F{$currentRow}", $total);
            }
            $sheet->getStyle("A{$currentRow}:F{$currentRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
            $currentRow++;
        }

        // === FOOTER ===
        $footerStartRow = $currentRow + 1;
        $sigCol = 'D';
        $sheet->setCellValue("{$sigCol}{$footerStartRow}", ($kelompokKkn->lokasi?->village_name ?? '..........................') . ", " . now()->translatedFormat('d F Y'));
        $sheet->setCellValue("{$sigCol}" . ($footerStartRow + 1), "Kepala Desa/Lurah,");
        $sheet->setCellValue("{$sigCol}" . ($footerStartRow + 5), ".........................................................");
        $sheet->setCellValue("{$sigCol}" . ($footerStartRow + 6), "NIP.");

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
                'periode'   => $period->name,
                'tahun'      => $period->tahunAkademik?->year ?? date('Y')
            ]);

            return $pdf->download("Database_Nilai_KKN_Periode_{$periodId}.pdf");
        } else {
            $kelompokKkn = KelompokKkn::with(['lokasi', 'dosen.user:id,name', 'periode.tahunAkademik'])->findOrFail($id);
            $students = $this->getStudentsForGroup($kelompokKkn);

            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('admin.exports.blanko_nilai', [
                'group'    => $kelompokKkn,
                'students' => $students,
                'periode' => $kelompokKkn->periode?->name ?? '57',
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

        $groups = KelompokKkn::with(['lokasi', 'dosen.user:id,name', 'periode.tahunAkademik'])
            ->where('period_id', $periodId)
            ->whereHas('dosen', function($q) {
                if (auth()->user()->hasRole('dpl')) {
                    $q->where('dosen_id', auth()->user()->dosen->id)->where('role', 'Ketua');
                }
            })
            ->orderBy('code')
            ->get();

        $zip = new \ZipArchive();
        $zipFileName = "Separated_Blanko_Penilaian_Periode_{$periodId}.zip";
        $zipPath = storage_path("app/public/{$zipFileName}");

        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === TRUE) {
            foreach ($groups as $group) {
                $students = $this->getStudentsForGroup($group);
                $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('admin.exports.blanko_nilai', [
                    'group'    => $group,
                    'students' => $students,
                    'periode' => $group->periode?->name ?? '57',
                    'tahun'    => $group->periode?->tahunAkademik?->year ?? date('Y')
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
        $registrations = PesertaKkn::with(['mahasiswa:id,user_id,nim,nama'])
            ->where('kelompok_id', $group->id)
            ->whereIn('status', ['approved', 'pending'])
            ->get();

        // Pre-load all scores for this group in one query to avoid N+1
        $userIds = $registrations->pluck('mahasiswa.user_id')->filter();
        $scores = NilaiKkn::where('kelompok_id', $group->id)
            ->whereIn('mahasiswa_id', $userIds)
            ->get()
            ->keyBy('mahasiswa_id');

        return $registrations->map(function ($reg) use ($scores) {
            $userId = $reg->mahasiswa->user_id;
            $score = $scores->get($userId);
            return [
                'user_id'    => $userId,
                'name'       => $reg->mahasiswa->nama,
                'nim'        => $reg->mahasiswa->nim,
                'discipline' => $score?->discipline_score ? (int)$score->discipline_score : null,
                'attitude'   => $score?->attitude_score ? (int)$score->attitude_score : null,
            ];
        })->values()->toArray();
    }

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
        $sheet->mergeCells('A1:G1');
        $sheet->setCellValue('A1', 'DATABASE NILAI KKN');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        
        $sheet->mergeCells('A2:G2');
        $sheet->setCellValue('A2', 'Angkatan ' . ($periodId ?? '57') . ' Tahun ' . date('Y'));
        $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(12);
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $headerRow = 5;
        $headers = ['NO', 'KELOMPOK', 'NAMA MAHASISWA', 'NIM', 'DISIPLIN', 'SIKAP', 'TOTAL NILAI'];
        $cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        
        foreach ($headers as $i => $h) {
            $col = $cols[$i];
            $sheet->setCellValue("{$col}{$headerRow}", $h);
            $sheet->getStyle("{$col}{$headerRow}")->getFont()->setBold(true);
            $sheet->getStyle("{$col}{$headerRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        }

        $currentRow = 6;
        foreach ($students as $idx => $student) {
            $sheet->setCellValue("A{$currentRow}", $idx + 1);
            $sheet->setCellValue("B{$currentRow}", $student['group_code']);
            $sheet->setCellValue("C{$currentRow}", $student['name']);
            $sheet->setCellValueExplicit("D{$currentRow}", $student['nim'], \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
            $sheet->setCellValue("E{$currentRow}", $student['discipline']);
            $sheet->setCellValue("F{$currentRow}", $student['attitude']);
            
            if ($student['discipline'] !== null && $student['attitude'] !== null) {
                $total = round(($student['discipline'] + $student['attitude']) / 2);
                $sheet->setCellValue("G{$currentRow}", $total);
            }
            $sheet->getStyle("A{$currentRow}:G{$currentRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
            $currentRow++;
        }
    }
}
