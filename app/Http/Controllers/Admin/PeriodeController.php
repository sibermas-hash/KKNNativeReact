<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\KknType;
use App\Http\Controllers\Controller;
use App\Models\KKN\JenisKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\TahunAkademik;
use App\Services\RedisCacheService;
use App\Traits\HandlesPagination;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
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
    use HandlesPagination;

    private function validatedPayload(Request $request): array
    {
        $validated = $request->validate([
            'academic_year_id' => ['required', 'exists:App\Models\KKN\TahunAkademik,id'],
            'jenis_kkn_id' => ['nullable', 'exists:App\Models\KKN\JenisKkn,id'],
            'periode' => ['required', 'integer'],
            'jenis' => ['nullable', 'string', 'max:100'],
            'program_type' => ['nullable', 'string', 'max:100'],
            'program_subtype' => ['nullable', 'string', 'max:100'],
            'name' => ['required', 'string', 'max:100'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'registration_start' => ['required', 'date'],
            'registration_end' => ['required', 'date', 'after:registration_start'],
            'kuota' => ['required', 'integer', 'min:1'],
            'grading_start' => ['nullable', 'date'],
            'grading_end' => ['nullable', 'date', 'after_or_equal:grading_start'],
            'is_active' => ['boolean'],
            'current_phase' => ['nullable', 'string', 'in:upcoming,registration,placement,execution,grading,finished'],
        ]);

        $jenisKkn = ! empty($validated['jenis_kkn_id'])
            ? JenisKkn::query()->find($validated['jenis_kkn_id'])
            : null;

        $governance = \App\Services\KKN\PeriodeGovernanceService::blueprint(
            $validated['program_type'] ?? $jenisKkn?->code,
            $validated['program_subtype'] ?? null,
            $validated['jenis'] ?? $jenisKkn?->code,
            $jenisKkn,
        );

        $validated['jenis'] = $governance['jenis_value'];
        $validated['program_type'] = $governance['program_type'];
        $validated['program_subtype'] = $governance['program_subtype'];
        $validated['registration_mode'] = $governance['registration_mode'];
        $validated['placement_mode'] = $governance['placement_mode'];

        return $validated;
    }

    public function index(Request $request): Response
    {
        Gate::authorize('manage-master-data');

        $periods = RedisCacheService::getPeriods(function () use ($request) {
            return Periode::with('tahunAkademik', 'jenisKkn')
                ->withCount(['kelompok', 'peserta', 'dplPeriods'])
                ->when($request->search, function ($query, $search) {
                    $s = str_replace(['%', '_'], ['\\%', '\\_'], $search);
                    $query->where('periode', 'like', "%{$s}%")
                        ->orWhere('jenis', 'like', "%{$s}%")
                        ->orWhere('name', 'like', "%{$s}%")
                        ->orWhereHas('jenisKkn', function ($q) use ($s) {
                            $q->where('name', 'ilike', "%{$s}%")
                                ->orWhere('code', 'ilike', "%{$s}%");
                        });
                })
                ->orderByDesc('periode')
                ->get();
        });

        $page = $request->input('page', 1);
        $perPage = 10;
        $periodsCollection = collect($periods);
        $periods = new LengthAwarePaginator(
            $periodsCollection->forPage($page, $perPage)->values(),
            $periodsCollection->count(),
            $perPage,
            $page,
            ['path' => route('admin.periode.index'), 'query' => $request->query()]
        );

        $periods->getCollection()->transform(function ($p) {
            $governance = $p->governance();

            return [
                'id' => $p->id,
                'jenis_kkn_id' => $p->jenis_kkn_id,
                'periode' => $p->periode,
                'jenis' => $p->jenis instanceof KknType ? $p->jenis->label() : $p->jenis,
                'program_type' => $governance['program_type'],
                'program_subtype' => $governance['program_subtype'],
                'registration_mode' => $governance['registration_mode'],
                'placement_mode' => $governance['placement_mode'],
                'program_type_label' => $governance['program_type_label'],
                'program_subtype_label' => $governance['program_subtype_label'],
                'registration_mode_label' => $governance['registration_mode_label'],
                'placement_mode_label' => $governance['placement_mode_label'],
                'self_service_enabled' => $p->usesSelfServiceRegistration(),
                'name' => $p->name,
                'start_date' => $p->start_date?->format('Y-m-d'),
                'end_date' => $p->end_date?->format('Y-m-d'),
                'registration_start' => $p->registration_start?->format('Y-m-d'),
                'registration_end' => $p->registration_end?->format('Y-m-d'),
                'grading_start' => $p->grading_start?->format('Y-m-d'),
                'grading_end' => $p->grading_end?->format('Y-m-d'),
                'kuota' => $p->kuota,
                'is_active' => $p->is_active,
                'current_phase' => $p->current_phase,
                'academic_year' => $p->tahunAkademik ? ['id' => $p->tahunAkademik->id, 'year' => $p->tahunAkademik->year] : null,
                'groups_count' => $p->kelompok_count,
                'participants_count' => $p->peserta_count,
                'dpl_periods_count' => $p->dpl_periods_count,
                'can_delete' => $this->canDeletePeriod($p),
                'delete_blocker' => $this->getDeleteBlockerReason($p),
                'duration_days' => $p->start_date && $p->end_date ? $p->start_date->diffInDays($p->end_date) : 0,
                'registration_duration_days' => $p->registration_start && $p->registration_end ? $p->registration_start->diffInDays($p->registration_end) : 0,
                'capacity_percentage' => $p->kuota > 0 ? round(($p->peserta_count / $p->kuota) * 100, 1) : 0,
            ];
        });

        $academicYears = TahunAkademik::orderByDesc('year')->get()
            ->map(fn ($ay) => ['id' => $ay->id, 'year' => $ay->year]);

        return Inertia::render('Admin/MasterData/Periods/Index', [
            'periods' => $this->formatPaginator($periods),
            'academicYears' => $academicYears,
            'filters' => $request->only('search'),
            'programOptions' => [
                'types' => JenisKkn::query()
                    ->active()
                    ->ordered()
                    ->get()
                    ->map(function (JenisKkn $jenisKkn) {
                        $governance = \App\Services\KKN\PeriodeGovernanceService::blueprint(
                            $jenisKkn->code,
                            null,
                            $jenisKkn->code,
                            $jenisKkn,
                        );

                        return [
                            'id' => $jenisKkn->id,
                            'value' => (string) $jenisKkn->id,
                            'label' => $jenisKkn->name,
                            'description' => $jenisKkn->description,
                            'registration_mode_label' => $jenisKkn->registrationModeLabel(),
                            'placement_mode_label' => $jenisKkn->placementModeLabel(),
                            'program_type' => $governance['program_type'],
                            'program_subtype' => $governance['program_subtype'],
                            'code' => $jenisKkn->code,
                        ];
                    })
                    ->values(),
                'subtypes' => collect(Periode::programSubtypeOptions())
                    ->map(fn (string $label, string $value) => [
                        'value' => $value,
                        'label' => $label,
                        'description' => Periode::programSubtypeDescriptions()[$value] ?? null,
                    ])
                    ->values(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatedPayload($request);

        $overlap = $this->checkDateOverlap(
            $validated['start_date'],
            $validated['end_date'],
            $validated['jenis_kkn_id'] ?? null
        );

        if ($overlap) {
            return redirect()->back()->withErrors([
                'start_date' => "Tanggal overlap dengan periode '{$overlap->name}' ({$overlap->start_date->format('d M Y')} - {$overlap->end_date->format('d M Y')})",
            ]);
        }

        if (! empty($validated['is_active'])) {
            Periode::where('is_active', true)->update(['is_active' => false]);
        }

        Periode::create($validated);
        RedisCacheService::invalidateMasterData();

        return redirect()->route('admin.periode.index')->with('success', 'Periode KKN berhasil ditambahkan.');
    }

    public function update(Request $request, Periode $periode): RedirectResponse
    {
        $validated = $this->validatedPayload($request);

        $overlap = $this->checkDateOverlap(
            $validated['start_date'],
            $validated['end_date'],
            $validated['jenis_kkn_id'] ?? null,
            $periode->id
        );

        if ($overlap) {
            return redirect()->back()->withErrors([
                'start_date' => "Tanggal overlap dengan periode '{$overlap->name}' ({$overlap->start_date->format('d M Y')} - {$overlap->end_date->format('d M Y')})",
            ]);
        }

        if (! empty($validated['is_active'])) {
            Periode::where('id', '!=', $periode->id)
                ->where('is_active', true)
                ->update(['is_active' => false]);
        }

        $periode->update($validated);
        RedisCacheService::invalidateMasterData();

        return redirect()->route('admin.periode.index')->with('success', 'Periode KKN berhasil diperbarui.');
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

                foreach ($group->slotTerkunci as $slot) {
                    $newSlot = $slot->replicate();
                    $newSlot->kelompok_id = $newGroup->id;
                    $newSlot->save();
                }
            }
        });

        return redirect()->route('admin.periode.index')->with('success', 'Struktur periode dan kelompok berhasil diduplikasi.');
    }

    public function destroy(Periode $periode): RedirectResponse
    {
        $periode->loadCount(['kelompok', 'peserta', 'dplPeriods']);

        if (! $this->canDeletePeriod($periode)) {
            return redirect()->route('admin.periode.index')->with('error', $this->getDeleteBlockerReason($periode));
        }

        $periode->delete();
        RedisCacheService::invalidateMasterData();

        return redirect()->route('admin.periode.index')->with('success', 'Periode KKN berhasil dihapus.');
    }

    private function canDeletePeriod(Periode $period): bool
    {
        return ! $period->is_active
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
        $candidate = $baseName.' (Copy)';
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
            $code = 'KKN-'.strtoupper(Str::random(6));
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

    private function checkDateOverlap(string $startDate, string $endDate, ?int $jenisKknId = null, ?int $excludeId = null): ?Periode
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

        if ($jenisKknId) {
            $query->where('jenis_kkn_id', $jenisKknId);
        }

        return $query->first();
    }

    public function export(): BinaryFileResponse
    {
        $periods = Periode::with('tahunAkademik')
            ->withCount(['kelompok', 'peserta', 'dplPeriods'])
            ->orderByDesc('periode')
            ->get();

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();

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

        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'color' => ['rgb' => '2563EB']],
        ];
        $sheet->getStyle('A1:O1')->applyFromArray($headerStyle);

        $row = 2;
        foreach ($periods as $index => $period) {
            $sheet->setCellValue("A{$row}", $index + 1);
            $sheet->setCellValue("B{$row}", $period->name);
            $sheet->setCellValue("C{$row}", $period->tahunAkademik?->year ?? '-');
            $sheet->setCellValue("D{$row}", $period->jenis instanceof KknType ? $period->jenis->label() : $period->jenis);
            $sheet->setCellValue("E{$row}", $period->start_date?->format('d M Y') ?? '-');
            $sheet->setCellValue("F{$row}", $period->end_date?->format('d M Y') ?? '-');
            $sheet->setCellValue("G{$row}", $period->start_date && $period->end_date ? $period->start_date->diffInDays($period->end_date) : 0);
            $sheet->setCellValue("H{$row}", $period->registration_start?->format('d M Y') ?? '-');
            $sheet->setCellValue("I{$row}", $period->registration_end?->format('d M Y') ?? '-');
            $sheet->setCellValue("J{$row}", $period->kuota);
            $sheet->setCellValue("K{$row}", $period->peserta_count);
            $sheet->setCellValue("L{$row}", $period->kuota > 0 ? round(($period->peserta_count / $period->kuota) * 100, 1).'%' : '0%');
            $sheet->setCellValue("M{$row}", $period->kelompok_count);
            $sheet->setCellValue("N{$row}", $period->dpl_periods_count);
            $sheet->setCellValue("O{$row}", $period->is_active ? 'Aktif' : 'Tidak Aktif');

            if ($period->is_active) {
                $sheet->getStyle("O{$row}")->getFont()->getColor()->setRGB('22C55E');
            }

            $row++;
        }

        foreach (range('A', 'O') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = 'data-periode-kkn-'.date('Y-m-d-His').'.xlsx';
        $writer = new Xlsx($spreadsheet);

        $exportDir = storage_path('framework/cache/exports');
        if (! is_dir($exportDir)) {
            mkdir($exportDir, 0750, true);
        }

        $tempFile = $exportDir.'/'.\Illuminate\Support\Str::uuid().'.xlsx';
        try {
            $writer->save($tempFile);

            return response()->download($tempFile, $filename)->deleteFileAfterSend(true);
        } catch (\Throwable $e) {
            if (file_exists($tempFile)) {
                unlink($tempFile);
            }
            \Illuminate\Support\Facades\Log::error('Periode export failed', ['exception' => $e]);
            abort(500, 'Gagal mengekspor data periode.');
        }
    }
}
