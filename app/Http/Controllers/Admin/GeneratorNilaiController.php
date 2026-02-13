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
    public function exportExcel(KelompokKkn $group): StreamedResponse
    {
        $group->load(['lokasi', 'dpl.user:id,name']);

        // Get students
        $studentsData = $this->getStudentsForGroup($group);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Lembar1');

        // === HEADER ===
        $sheet->mergeCells('A1:F1');
        $sheet->setCellValue('A1', 'BLANKO PENILAIAN PESERTA KKN');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells('A2:F2');
        $sheet->setCellValue('A2', 'ANGKATAN 57 TAHUN 2026');
        $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(12);
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // === META ===
        $sheet->mergeCells('A4:B4');
        $sheet->setCellValue('A4', 'KELOMPOK');
        $sheet->setCellValue('C4', ': ' . $group->code);

        $sheet->mergeCells('A5:B5');
        $sheet->setCellValue('A5', 'DESA');
        $sheet->setCellValue('C5', ': ' . ($group->lokasi?->village_name ?? '-'));

        $sheet->mergeCells('A6:B6');
        $sheet->setCellValue('A6', 'KECAMATAN');
        $sheet->setCellValue('C6', ': ' . ($group->lokasi?->address ?? '-'));

        $sheet->mergeCells('A7:B7');
        $sheet->setCellValue('A7', 'KABUPATEN');
        $sheet->setCellValue('C7', ': ' . ($group->nama_kelompok ?? '-'));

        $sheet->mergeCells('A8:B8');
        $sheet->setCellValue('A8', 'DPL');
        $sheet->setCellValue('C8', ': ' . ($group->dpl?->user?->name ?? '-'));

        // === TABLE HEADER (Row 10) ===
        $headers = ['NO', 'NAMA MAHASISWA', 'NIM', 'KEDISIPLINAN', 'SIKAP', 'NILAI TOTAL'];
        foreach ($headers as $i => $h) {
            $col = chr(65 + $i); // A, B, C, ...
            $sheet->setCellValue("{$col}10", $h);
        }
        $sheet->getStyle('A10:F10')->getFont()->setBold(true);
        $sheet->getStyle('A10:F10')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('A10:F10')->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

        // === STUDENT DATA (Row 11+) ===
        $row = 11;
        foreach ($studentsData as $idx => $student) {
            $sheet->setCellValue("A{$row}", $idx + 1);
            $sheet->setCellValue("B{$row}", $student['name']);
            $sheet->setCellValue("C{$row}", $student['nim']);

            if ($student['discipline'] !== null) {
                $sheet->setCellValue("D{$row}", $student['discipline']);
            }
            if ($student['attitude'] !== null) {
                $sheet->setCellValue("E{$row}", $student['attitude']);
            }
            if ($student['discipline'] !== null && $student['attitude'] !== null) {
                $total = round(($student['discipline'] + $student['attitude']) / 2);
                $sheet->setCellValue("F{$row}", $total);
            }

            $sheet->getStyle("A{$row}:F{$row}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
            $row++;
        }

        // Fill remaining empty rows up to 15 students
        $maxRows = max(15, count($studentsData));
        while ($row <= 10 + $maxRows) {
            $sheet->setCellValue("A{$row}", $row - 10);
            $sheet->getStyle("A{$row}:F{$row}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
            $row++;
        }

        // === FOOTER ===
        $footerRow = $row + 1;
        $sheet->setCellValue("B{$footerRow}", '*Keterangan');
        $sheet->setCellValue("D{$footerRow}", '…........................., …..............................2026');

        $footerRow2 = $footerRow + 1;
        $sheet->setCellValue("B{$footerRow2}", 'Rentang Nilai 60-100');
        $sheet->setCellValue("D{$footerRow2}", 'Kepala Desa/Lurah,');

        $signRow = $footerRow2 + 5;
        $sheet->setCellValue("D{$signRow}", '…........................................................');
        $signRow2 = $signRow + 1;
        $sheet->setCellValue("D{$signRow2}", 'NIP');

        // === COLUMN WIDTHS ===
        $sheet->getColumnDimension('A')->setWidth(5);
        $sheet->getColumnDimension('B')->setWidth(35);
        $sheet->getColumnDimension('C')->setWidth(18);
        $sheet->getColumnDimension('D')->setWidth(16);
        $sheet->getColumnDimension('E')->setWidth(12);
        $sheet->getColumnDimension('F')->setWidth(14);

        // Stream response
        $filename = "Blanko_Penilaian_Kelompok_{$group->code}.xlsx";

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
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
