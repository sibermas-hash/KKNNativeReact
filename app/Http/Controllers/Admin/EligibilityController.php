<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\Fakultas;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Services\EligibilityService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class EligibilityController extends Controller
{
    public function __construct(
        private EligibilityService $eligibilityService
    ) {}

    public function index(Request $request): Response
    {
        Gate::authorize('manage-master-data');

        $user = auth()->user();
        $isFacultyAdmin = $user?->hasRole('faculty_admin');
        
        $periodeId = $request->integer('period_id');
        $facultyId = $isFacultyAdmin ? $user?->faculty_id : $request->integer('faculty_id');
        $showEligible = $request->boolean('show_eligible', true);

        $result = $this->eligibilityService->getEligibleStudents($periodeId, $facultyId);

        // Pagination manual
        $studentsToShow = $showEligible ? $result['eligible'] : $result['not_eligible'];
        $perPage = 20;
        $currentPage = $request->integer('page', 1);
        $total = $studentsToShow->count();
        $paginatedStudents = $studentsToShow->slice(($currentPage - 1) * $perPage, $perPage)->values();

        $periods = Periode::orderByDesc('start_date')->get(['id', 'name']);

        return Inertia::render('Admin/EligibilityCheck/Index', [
            'students' => $paginatedStudents,
            'pagination' => [
                'current_page' => $currentPage,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => max(1, ceil($total / $perPage)),
            ],
            'stats' => [
                'total' => $result['total'],
                'eligible_count' => $result['eligible_count'],
                'not_eligible_count' => $result['not_eligible_count'],
                'eligibility_rate' => $result['eligibility_rate'],
            ],
            'filters' => [
                'period_id' => $periodeId,
                'faculty_id' => $facultyId,
                'show_eligible' => $showEligible,
            ],
            'periods' => $periods,
            'faculties' => Fakultas::orderBy('nama')->get(['id', 'nama as name']),
        ]);
    }

    public function checkStudent(Mahasiswa $mahasiswa, Request $request)
    {
        Gate::authorize('manage-master-data');

        $periodeId = $request->integer('period_id');
        $result = $this->eligibilityService->checkEligibility($mahasiswa, $periodeId);

        return response()->json($result);
    }

    public function export(Request $request): BinaryFileResponse
    {
        Gate::authorize('manage-master-data');

        $user = auth()->user();
        $isFacultyAdmin = $user?->hasRole('faculty_admin');
        
        $periodeId = $request->integer('period_id');
        $facultyId = $isFacultyAdmin ? $user?->faculty_id : $request->integer('faculty_id');

        $result = $this->eligibilityService->getEligibleStudents($periodeId, $facultyId);

        $spreadsheet = new Spreadsheet();
        
        // Sheet 1: Eligible Students
        $sheet1 = $spreadsheet->getActiveSheet();
        $sheet1->setTitle('Mahasiswa Eligible');
        
        $headers1 = ['No', 'NIM', 'Nama', 'Fakultas', 'Program Studi', 'SKS', 'IPK', 'BTA-PPI', 'Surat Sehat', 'Izin Ortu'];
        $col = 'A';
        foreach ($headers1 as $header) {
            $sheet1->setCellValue("{$col}1", $header);
            $col++;
        }
        
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'color' => ['rgb' => '22C55E']],
        ];
        $sheet1->getStyle('A1:J1')->applyFromArray($headerStyle);

        $row = 2;
        foreach ($result['eligible'] as $index => $student) {
            $sheet1->setCellValue("A{$row}", $index + 1);
            $sheet1->setCellValue("B{$row}", $student['nim']);
            $sheet1->setCellValue("C{$row}", $student['nama']);
            $sheet1->setCellValue("D{$row}", $student['mahasiswa']->fakultas?->nama ?? '-');
            $sheet1->setCellValue("E{$row}", $student['mahasiswa']->prodi?->nama ?? '-');
            $sheet1->setCellValue("F{$row}", $student['sks_completed'] ?? 0);
            $sheet1->setCellValue("G{$row}", $student['gpa'] ? number_format($student['gpa'], 2) : '-');
            $sheet1->setCellValue("H{$row}", $student['is_bta_ppi_passed'] ? 'LULUS' : 'BELUM');
            $sheet1->setCellValue("I{$row}", $student['has_health_certificate'] ? 'YA' : 'TIDAK');
            $sheet1->setCellValue("J{$row}", $student['has_parent_permission'] ? 'YA' : 'TIDAK');
            $row++;
        }

        // Sheet 2: Not Eligible Students
        $sheet2 = $spreadsheet->createSheet();
        $sheet2->setTitle('Mahasiswa Tidak Eligible');
        
        $headers2 = ['No', 'NIM', 'Nama', 'Fakultas', 'Program Studi', 'SKS', 'IPK', 'BTA-PPI', 'Issues'];
        $col = 'A';
        foreach ($headers2 as $header) {
            $sheet2->setCellValue("{$col}1", $header);
            $col++;
        }
        
        $headerStyle2 = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'color' => ['rgb' => 'EF4444']],
        ];
        $sheet2->getStyle('A1:I1')->applyFromArray($headerStyle2);

        $row = 2;
        foreach ($result['not_eligible'] as $index => $student) {
            $sheet2->setCellValue("A{$row}", $index + 1);
            $sheet2->setCellValue("B{$row}", $student['nim']);
            $sheet2->setCellValue("C{$row}", $student['nama']);
            $sheet2->setCellValue("D{$row}", $student['mahasiswa']->fakultas?->nama ?? '-');
            $sheet2->setCellValue("E{$row}", $student['mahasiswa']->prodi?->nama ?? '-');
            $sheet2->setCellValue("F{$row}", $student['sks_completed'] ?? 0);
            $sheet2->setCellValue("G{$row}", $student['gpa'] ? number_format($student['gpa'], 2) : '-');
            $sheet2->setCellValue("H{$row}", $student['is_bta_ppi_passed'] ? 'LULUS' : 'BELUM');
            $sheet2->setCellValue("I{$row}", implode('; ', array_column($student['issues'], 'message')));
            $row++;
        }

        // Auto-size columns
        foreach (range('A', 'J') as $col) {
            $sheet1->getColumnDimension($col)->setAutoSize(true);
            $sheet2->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = 'Eligibility_Report_KKN_' . date('Y-m-d_His') . '.xlsx';
        $writer = new Xlsx($spreadsheet);
        $tempFile = tempnam(sys_get_temp_dir(), 'kkn_eligibility_');
        $writer->save($tempFile . '.xlsx');
        $finalFile = $tempFile . '.xlsx';

        return response()->download($finalFile, $filename)->deleteFileAfterSend(true);
    }

    public function bulkUpdateSks(Request $request): RedirectResponse
    {
        Gate::authorize('manage-master-data');

        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'integer', 'exists:mahasiswa,id'],
            'sks' => ['required', 'integer', 'min:0', 'max:200'],
        ]);

        $count = Mahasiswa::whereIn('id', $validated['ids'])
            ->update(['sks_completed' => $validated['sks']]);

        return redirect()->back()->with('success', "SKS berhasil diperbarui untuk {$count} mahasiswa.");
    }
}
