<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Models\KKN\Fakultas;
use App\Models\KKN\LaporanAkhir;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\Periode;
use App\Repositories\KknScoreRepository;
use App\Services\GradingService as BaseGradingService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class GradingService
{
    public function __construct(
        private readonly KknScoreRepository $repo,
        private readonly BaseGradingService $grading
    ) {}

    /**
     * Finalize a single score
     */
    public function finalize(NilaiKkn $score, int $adminId): bool
    {
        $score->loadMissing('mahasiswa.user');

        if ($score->is_finalized) {
            return true;
        }

        if (is_null($score->total_score)) {
            throw new \Exception('Nilai akhir belum lengkap dan belum dapat difinalisasi.');
        }

        if (! $score->mahasiswa) {
            throw new \Exception('Data mahasiswa untuk nilai ini tidak ditemukan.');
        }

        $reportApproved = LaporanAkhir::where('mahasiswa_id', $score->mahasiswa->id)
            ->where('kelompok_id', $score->kelompok_id)
            ->where('status', 'approved')
            ->exists();

        if (! $reportApproved) {
            throw new \Exception('Laporan akhir mahasiswa belum disetujui, sehingga nilai belum dapat difinalisasi.');
        }

        $score->update(['is_finalized' => true]);

        if ($score->mahasiswa?->user) {
            $score->mahasiswa->user->notify(new \App\Notifications\KknActivityNotification([
                'type' => 'success',
                'title' => 'Nilai KKN Difinalisasi',
                'message' => 'Nilai KKN Anda telah difinalisasi oleh Admin LPPM. Silakan unduh sertifikat.',
                'icon' => 'academic-cap',
                'action' => route('student.dashboard'),
            ]));
        }

        return true;
    }

    /**
     * Dispatch mass finalization
     */
    public function finalizeMass(int $periodId): void
    {
        $this->grading->dispatchMassFinalization($periodId);
    }

    /**
     * Export ledger to Excel
     */
    public function exportLedger(int $periodeId, ?int $facultyId = null, ?string $search = null, ?string $huruf = null): BinaryFileResponse
    {
        $rows = $this->repo->getRekapNilai($periodeId, [
            'faculty_id' => $facultyId,
            'search' => $search,
            'huruf' => $huruf,
        ]);

        $periode = Periode::find($periodeId);
        if (! $periode) {
            throw new \Exception('Periode rekap nilai tidak ditemukan.');
        }

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Headers
        $headers = ['No', 'NIM', 'Nama', 'Prodi', 'Fakultas', 'Kelompok', 'Nilai DPL', 'Nilai Mitra', 'Nilai Admin', 'Nilai Akhir', 'Grade', 'Status'];
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue("{$col}1", $header);
            $col++;
        }

        // Styling header
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => '1E40AF']],
        ];
        $sheet->getStyle('A1:L1')->applyFromArray($headerStyle);

        // Data
        $row = 2;
        foreach ($rows as $index => $r) {
            $sheet->setCellValue("A{$row}", $index + 1);
            $sheet->setCellValue("B{$row}", $r->nim ?? '-');
            $sheet->setCellValue("C{$row}", $r->nama ?? '-');
            $sheet->setCellValue("D{$row}", $r->prodi ?? '-');
            $sheet->setCellValue("E{$row}", $r->fakultas ?? '-');
            $sheet->setCellValue("F{$row}", $r->group_name ?? '-');
            $sheet->setCellValue("G{$row}", $r->n_dpl ?? '-');
            $sheet->setCellValue("H{$row}", $r->n_mitra ?? '-');
            $sheet->setCellValue("I{$row}", $r->n_admin ?? '-');
            $sheet->setCellValue("J{$row}", $r->nilai_akhir ?? '-');
            $sheet->setCellValue("K{$row}", $r->huruf ?? '-');
            $sheet->setCellValue("L{$row}", $r->is_finalized ? 'Final' : 'Draft');

            // Color code grade
            $gradeColor = match ($r->huruf) {
                'A' => '22C55E',
                'A-' => '4ADE80',
                'B+' => '60A5FA',
                'B' => '3B82F6',
                'B-' => '93C5FD',
                'C+' => 'FBBF24',
                'C' => 'F59E0B',
                'D' => 'F97316',
                'E' => 'EF4444',
                default => '9CA3AF',
            };
            $sheet->getStyle("K{$row}")->getFont()->getColor()->setRGB($gradeColor);

            $row++;
        }

        // Auto-size columns
        foreach (range('A', 'L') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $facultyName = $facultyId ? Fakultas::find($facultyId)?->nama : 'Semua';
        $filename = "Ledger_Nilai_KKN_{$periode->name}_{$facultyName}_".date('Y-m-d_His').'.xlsx';
        $writer = new Xlsx($spreadsheet);

        $exportDir = storage_path('framework/cache/exports');
        if (! is_dir($exportDir)) {
            mkdir($exportDir, 0750, true);
        }

        $tempFile = $exportDir.'/'.Str::uuid().'.xlsx';
        try {
            $writer->save($tempFile);
            return response()->download($tempFile, $filename)->deleteFileAfterSend(true);
        } catch (\Throwable $e) {
            if (file_exists($tempFile)) {
                unlink($tempFile);
            }
            Log::error('Ledger export failed', ['exception' => $e]);
            throw new \Exception('Gagal mengekspor ledger nilai.');
        }
    }
}
