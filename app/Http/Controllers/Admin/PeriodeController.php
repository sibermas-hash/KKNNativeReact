<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\TahunAkademik;
use App\Models\KKN\Periode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class PeriodeController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('manage-master-data');
        
        $periods = Periode::with('tahunAkademik')
            ->withCount(['kelompok', 'peserta', 'dplPeriods'])
            ->when($request->search, function ($query, $search) {
                $s = str_replace(['%', '_'], ['\\%', '\\_'], $search);
                $query->where('periode', 'like', "%{$s}%")
                      ->orWhere('jenis', 'like', "%{$s}%")
                      ->orWhere('name', 'like', "%{$s}%");
            })
            ->orderByDesc('periode')
            ->paginate(10)
            ->withQueryString();

        $periods->getCollection()->transform(fn ($p) => [
            'id' => $p->id,
            'periode' => $p->periode,
            'jenis' => $p->jenis,
            'name' => $p->name,
            'start_date' => $p->start_date?->format('Y-m-d'),
            'end_date' => $p->end_date?->format('Y-m-d'),
            'registration_start' => $p->registration_start?->format('Y-m-d'),
            'registration_end' => $p->registration_end?->format('Y-m-d'),
            'grading_start' => $p->grading_start?->format('Y-m-d'),
            'grading_end' => $p->grading_end?->format('Y-m-d'),
            'kuota' => $p->kuota,
            'is_active' => $p->is_active,
            'academic_year' => $p->tahunAkademik ? ['id' => $p->tahunAkademik->id, 'year' => $p->tahunAkademik->year] : null,
            'groups_count' => $p->kelompok_count,
            'participants_count' => $p->peserta_count,
            'dpl_periods_count' => $p->dpl_periods_count,
            'can_delete' => $this->canDeletePeriod($p),
            'delete_blocker' => $this->getDeleteBlockerReason($p),
            'duration_days' => $p->start_date && $p->end_date ? $p->start_date->diffInDays($p->end_date) : 0,
            'registration_duration_days' => $p->registration_start && $p->registration_end ? $p->registration_start->diffInDays($p->registration_end) : 0,
            'capacity_percentage' => $p->kuota > 0 ? round(($p->peserta_count / $p->kuota) * 100, 1) : 0,
        ]);

        $academicYears = TahunAkademik::orderByDesc('year')->get()
            ->map(fn ($ay) => ['id' => $ay->id, 'year' => $ay->year]);

        return Inertia::render('Admin/Periods/Index', [
            'periods' => $periods,
            'academicYears' => $academicYears,
            'filters' => $request->only('search'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'academic_year_id' => ['required', 'exists:tahun_akademik,id'],
            'periode' => ['required', 'integer'],
            'jenis' => ['required', 'string', 'max:100'],
            'name' => ['required', 'string', 'max:100'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'registration_start' => ['required', 'date'],
            'registration_end' => ['required', 'date', 'after:registration_start'],
            'kuota' => ['required', 'integer', 'min:1'],
            'grading_start' => ['nullable', 'date'],
            'grading_end' => ['nullable', 'date', 'after_or_equal:grading_start'],
            'is_active' => ['boolean'],
        ]);

        // Validate date overlap dengan periode lain
        $overlap = $this->checkDateOverlap(
            $validated['start_date'],
            $validated['end_date']
        );

        if ($overlap) {
            return redirect()->back()->withErrors([
                'start_date' => "Tanggal overlap dengan periode '{$overlap->name}' ({$overlap->start_date->format('d M Y')} - {$overlap->end_date->format('d M Y')})"
            ]);
        }

        if (!empty($validated['is_active'])) {
            Periode::where('is_active', true)->update(['is_active' => false]);
            Periode::flushContextCache();
        }

        Periode::create($validated);

        return redirect()->back()->with('success', 'Periode KKN berhasil ditambahkan.');
    }

    public function update(Request $request, Periode $periode): RedirectResponse
    {
        $validated = $request->validate([
            'academic_year_id' => ['required', 'exists:tahun_akademik,id'],
            'periode' => ['required', 'integer'],
            'jenis' => ['required', 'string', 'max:100'],
            'name' => ['required', 'string', 'max:100'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'registration_start' => ['required', 'date'],
            'registration_end' => ['required', 'date', 'after:registration_start'],
            'kuota' => ['required', 'integer', 'min:1'],
            'grading_start' => ['nullable', 'date'],
            'grading_end' => ['nullable', 'date', 'after_or_equal:grading_start'],
            'is_active' => ['boolean'],
        ]);

        if (!empty($validated['is_active'])) {
            Periode::where('id', '!=', $periode->id)
                ->where('is_active', true)
                ->update(['is_active' => false]);
            Periode::flushContextCache();
        }

        $periode->update($validated);

        return redirect()->back()->with('success', 'Periode KKN berhasil diperbarui.');
    }

    public function duplicate(Periode $periode): RedirectResponse
    {
        DB::transaction(function () use ($periode) {
            $periode->loadMissing('kelompok');

            $newPeriod = $periode->replicate();
            $newPeriod->name = $this->generateCopyName($periode->name);
            $newPeriod->is_active = false;
            $newPeriod->save();

            foreach ($periode->kelompok as $group) {
                $newGroup = $group->replicate();
                $newGroup->period_id = $newPeriod->id;
                $newGroup->dpl_id = null;
                $newGroup->dpl_period_id = null;
                $newGroup->status = 'draft';
                $newGroup->code = $this->generateUniqueGroupCode();
                $newGroup->token = $this->generateUniqueGroupToken();
                $newGroup->save();

                // Duplicate slot rules for the new group
                foreach ($group->slotTerkunci as $slot) {
                    $newSlot = $slot->replicate();
                    $newSlot->kelompok_id = $newGroup->id;
                    $newSlot->save();
                }
            }
        });

        return redirect()->back()->with('success', 'Struktur periode dan kelompok berhasil diduplikasi.');
    }

    public function destroy(Periode $periode): RedirectResponse
    {
        $periode->loadCount(['kelompok', 'peserta', 'dplPeriods']);

        if (!$this->canDeletePeriod($periode)) {
            return redirect()->back()->with('error', $this->getDeleteBlockerReason($periode));
        }

        $periode->delete();

        return redirect()->back()->with('success', 'Periode KKN berhasil dihapus.');
    }

    private function canDeletePeriod(Periode $period): bool
    {
        return !$period->is_active
            && (int) ($period->kelompok_count ?? 0) === 0
            && (int) ($period->peserta_count ?? 0) === 0
            && (int) ($period->dpl_periods_count ?? 0) === 0;
    }

    private function getDeleteBlockerReason(Periode $period): ?string
    {
        if ($period->is_active) {
            return 'Periode aktif tidak dapat dihapus. Nonaktifkan atau aktifkan periode lain terlebih dahulu.';
        }

        if (
            (int) ($period->kelompok_count ?? 0) > 0 ||
            (int) ($period->peserta_count ?? 0) > 0 ||
            (int) ($period->dpl_periods_count ?? 0) > 0
        ) {
            return 'Periode tidak dapat dihapus karena masih memiliki kelompok, peserta, atau penugasan DPL.';
        }

        return null;
    }

    private function generateCopyName(string $name): string
    {
        $baseName = preg_replace('/\s+\(Copy(?: \d+)?\)$/', '', $name) ?: $name;
        $candidate = $baseName . ' (Copy)';
        $suffix = 2;

        while (Periode::withTrashed()->where('name', $candidate)->exists()) {
            $candidate = sprintf('%s (Copy %d)', $baseName, $suffix);
            $suffix++;
        }

        return $candidate;
    }

    private function generateUniqueGroupCode(): string
    {
        do {
            $code = 'KKN-' . strtoupper(Str::random(6));
        } while (KelompokKkn::withTrashed()->where('code', $code)->exists());

        return $code;
    }

    private function generateUniqueGroupToken(): string
    {
        do {
            $token = strtoupper(Str::random(8));
        } while (KelompokKkn::withTrashed()->where('token', $token)->exists());

        return $token;
    }

    /**
     * Check apakah ada overlap tanggal dengan periode lain
     */
    private function checkDateOverlap(string $startDate, string $endDate, ?int $excludeId = null): ?Periode
    {
        $query = Periode::where(function ($q) use ($startDate, $endDate) {
            $q->whereBetween('start_date', [$startDate, $endDate])
              ->orWhereBetween('end_date', [$startDate, $endDate])
              ->orWhere(function ($q2) use ($startDate, $endDate) {
                  $q2->where('start_date', '<=', $startDate)
                     ->where('end_date', '>=', $endDate);
              });
        });

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->first();
    }

    /**
     * Export data periode ke Excel
     */
    public function export(): BinaryFileResponse
    {
        $periods = Periode::with('tahunAkademik')
            ->withCount(['kelompok', 'peserta', 'dplPeriods'])
            ->orderByDesc('periode')
            ->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Header
        $sheet->setCellValue('A1', 'No');
        $sheet->setCellValue('B1', 'Nama Periode');
        $sheet->setCellValue('C1', 'Tahun Akademik');
        $sheet->setCellValue('D1', 'Jenis');
        $sheet->setCellValue('E1', 'Tanggal Mulai');
        $sheet->setCellValue('F1', 'Tanggal Selesai');
        $sheet->setCellValue('G1', 'Durasi (Hari)');
        $sheet->setCellValue('H1', 'Pendaftaran Mulai');
        $sheet->setCellValue('I1', 'Pendaftaran Selesai');
        $sheet->setCellValue('J1', 'Kuota');
        $sheet->setCellValue('K1', 'Jumlah Peserta');
        $sheet->setCellValue('L1', 'Persentase');
        $sheet->setCellValue('M1', 'Jumlah Kelompok');
        $sheet->setCellValue('N1', 'Jumlah DPL');
        $sheet->setCellValue('O1', 'Status');

        // Styling header
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'color' => ['rgb' => '2563EB']],
        ];
        $sheet->getStyle('A1:O1')->applyFromArray($headerStyle);

        // Data
        $row = 2;
        foreach ($periods as $index => $period) {
            $sheet->setCellValue("A{$row}", $index + 1);
            $sheet->setCellValue("B{$row}", $period->name);
            $sheet->setCellValue("C{$row}", $period->tahunAkademik?->year ?? '-');
            $sheet->setCellValue("D{$row}", $period->jenis);
            $sheet->setCellValue("E{$row}", $period->start_date?->format('d M Y') ?? '-');
            $sheet->setCellValue("F{$row}", $period->end_date?->format('d M Y') ?? '-');
            $sheet->setCellValue("G{$row}", $period->start_date && $period->end_date ? $period->start_date->diffInDays($period->end_date) : 0);
            $sheet->setCellValue("H{$row}", $period->registration_start?->format('d M Y') ?? '-');
            $sheet->setCellValue("I{$row}", $period->registration_end?->format('d M Y') ?? '-');
            $sheet->setCellValue("J{$row}", $period->kuota);
            $sheet->setCellValue("K{$row}", $period->peserta_count);
            $sheet->setCellValue("L{$row}", $period->kuota > 0 ? round(($period->peserta_count / $period->kuota) * 100, 1) . '%' : '0%');
            $sheet->setCellValue("M{$row}", $period->kelompok_count);
            $sheet->setCellValue("N{$row}", $period->dpl_periods_count);
            $sheet->setCellValue("O{$row}", $period->is_active ? 'Aktif' : 'Tidak Aktif');

            // Color code status
            if ($period->is_active) {
                $sheet->getStyle("O{$row}")->getFont()->getColor()->setRGB('22C55E');
            }

            $row++;
        }

        // Auto-size columns
        foreach (range('A', 'O') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Write to file
        $filename = 'data-periode-kkn-' . date('Y-m-d-His') . '.xlsx';
        $writer = new Xlsx($spreadsheet);
        $tempFile = tempnam(sys_get_temp_dir(), 'kkn_export_');
        $writer->save($tempFile . '.xlsx');
        $finalFile = $tempFile . '.xlsx';

        return response()->download($finalFile, $filename)->deleteFileAfterSend(true);
    }
}
