<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\JenisKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\TahunAkademik;
use App\Services\Admin\PeriodeService;
use App\Services\KKN\PeriodeGovernanceService;
use App\Traits\HandlesPagination;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Ai\AnonymousAgent;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class PeriodeController extends Controller
{
    use HandlesPagination;

    public function __construct(
        protected PeriodeService $periodeService
    ) {}

    private function validatedPayload(Request $request): array
    {
        return $request->validate([
            'academic_year_id' => ['required', 'exists:App\Models\KKN\TahunAkademik,id'],
            'jenis_kkn_id' => ['required', 'exists:App\Models\KKN\JenisKkn,id'],
            'periode' => ['required', 'integer'],
            'name' => ['nullable', 'string', 'max:100'],
            'theme' => ['nullable', 'string', 'max:255'],
            'start_date' => ['required', 'date', function ($attribute, $value, $fail) use ($request) {                $registrationEnd = $request->input('registration_end');
                if ($registrationEnd && $value) {
                    $endDate = Carbon::parse($registrationEnd);
                    $startDate = Carbon::parse($value);
                    $gap = $endDate->diffInDays($startDate);
                    if ($gap < 7) {
                        $fail("Jarak minimal antara penutupan pendaftaran dan mulai pelaksanaan adalah 7 hari. Saat ini hanya {$gap} hari.");
                    }
                }
            }],
            'end_date' => ['required', 'date', 'after:start_date'],
            'registration_start' => ['required', 'date'],
            'registration_end' => ['required', 'date', 'after:registration_start'],
            'kuota' => ['required', 'integer', 'min:1'],
            'grading_start' => ['nullable', 'date'],
            'grading_end' => ['nullable', 'date', 'after_or_equal:grading_start'],
            'is_active' => ['boolean', function ($attribute, $value, $fail) use ($request) {
                if ($value && $request->input('jenis_kkn_id')) {
                    $jenisKknId = $request->input('jenis_kkn_id');
                    $existingActive = Periode::where('jenis_kkn_id', $jenisKknId)
                        ->where('is_active', true);

                    $periode = $request->route('periode');
                    $periodeId = $periode instanceof Periode ? $periode->id : $periode;
                    if ($periodeId) {
                        $existingActive->where('id', '!=', $periodeId);
                    }

                    if ($existingActive->exists()) {
                        $fail('Hanya boleh ada 1 periode aktif untuk setiap Jenis KKN.');
                    }
                }
            }],
            'current_phase' => ['nullable', 'string', 'in:upcoming,registration,placement,execution,grading,finished'],
        ]);
    }

    public function index(Request $request): Response
    {
        Gate::authorize('manage-master-data');

        $search = $request->search;

        return Inertia::render('Admin/MasterData/Periods/Index', [
            'periods' => Inertia::defer(function () use ($request, $search) {
                $query = Periode::with(['tahunAkademik', 'jenisKkn'])
                    ->withCount(['kelompok', 'peserta', 'dplPeriods'])
                    ->when($search, function ($query, $search) {
                        $s = str_replace(['%', '_'], ['\\%', '\\_'], $search);
                        $query->where(function ($q) use ($s) {
                            $q->where(DB::raw('CAST(periode AS TEXT)'), 'like', "%{$s}%")
                                ->orWhere('jenis', 'like', "%{$s}%")
                                ->orWhere('name', 'like', "%{$s}%")
                                ->orWhereHas('jenisKkn', function ($q) use ($s) {
                                    $q->where('name', 'ilike', "%{$s}%")
                                        ->orWhere('code', 'ilike', "%{$s}%");
                                });
                        });
                    })
                    ->when($request->jenis_kkn_id, function ($query, $jenisKknId) {
                        $query->where('jenis_kkn_id', $jenisKknId);
                    })
                    ->orderByDesc('periode');

                $paginator = $query->paginate(10);

                $paginator->getCollection()->transform(function ($p) {
                    $jenisKkn = $p->jenisKkn;
                    $governance = $p->governance() ?: [];

                    return [
                        'id' => $p->id,
                        'jenis_kkn_id' => $p->jenis_kkn_id,
                        'periode' => $p->periode,
                        'jenis' => $jenisKkn?->name ?? '-',
                        'program_type' => $governance['program_type'] ?? 'reguler',
                        'program_subtype' => $governance['program_subtype'] ?? null,
                        'registration_mode' => $jenisKkn?->registration_mode ?? 'open',
                        'placement_mode' => $jenisKkn?->placement_mode ?? 'manual_admin',
                        'program_type_label' => $jenisKkn?->name ?? 'Reguler',
                        'program_subtype_label' => $governance['program_subtype_label'] ?? '-',
                        'registration_mode_label' => $jenisKkn?->registrationModeLabel() ?? 'Terbuka',
                        'placement_mode_label' => $jenisKkn?->placementModeLabel() ?? 'Manual',
                        'self_service_enabled' => $jenisKkn
                            ? $jenisKkn->registration_mode === Periode::REGISTRATION_MODE_OPEN
                                && $jenisKkn->placement_mode === Periode::PLACEMENT_MODE_AUTOMATIC_AFTER_APPROVAL
                            : false,
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
                        'can_delete' => $this->periodeService->canDelete($p),
                        'delete_blocker' => $this->periodeService->getDeleteBlockerReason($p),
                        'duration_days' => $p->start_date && $p->end_date ? $p->start_date->diffInDays($p->end_date) : 0,
                        'registration_duration_days' => $p->registration_start && $p->registration_end ? $p->registration_start->diffInDays($p->registration_end) : 0,
                        'capacity_percentage' => $p->kuota > 0 ? round(($p->peserta_count / $p->kuota) * 100, 1) : 0,
                    ];
                });

                return $this->formatPaginator($paginator);
            }),
            'academicYears' => Inertia::defer(function () {
                $academicYearsQuery = TahunAkademik::where('is_active', true)->orderByDesc('year');
                if ($academicYearsQuery->count() === 0) {
                    $academicYearsQuery = TahunAkademik::orderByDesc('year');
                }

                return $academicYearsQuery->get()->map(fn ($ay) => ['id' => $ay->id, 'year' => $ay->year]);
            }),
            'jenisKkn' => Inertia::defer(function () {
                return JenisKkn::where('is_active', true)->get()
                    ->map(fn ($j) => ['id' => $j->id, 'name' => $j->name, 'code' => $j->code]);
            }),
            'filters' => $request->only(['search', 'jenis_kkn_id']),
            'totalStats' => Inertia::defer(function () {
                return [
                    'active_count' => Periode::where('is_active', true)->count(),
                    'total_groups' => DB::table('kelompok_kkn')->count(),
                    'total_participants' => DB::table('peserta_kkn')->count(),
                    'upcoming_registrations' => Periode::where('current_phase', 'registration')->count(),
                ];
            }),
            'programOptions' => Inertia::defer(function () {
                $cacheKey = 'periode_program_options';

                if (Cache::has($cacheKey)) {
                    return Cache::get($cacheKey);
                }

                $jenisKkns = JenisKkn::query()->active()->ordered()->get();

                $options = [
                    'types' => $jenisKkns->map(function (JenisKkn $jenisKkn) {
                        $governance = PeriodeGovernanceService::blueprint(
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
                    })->values(),
                    'subtypes' => collect(Periode::programSubtypeOptions())
                        ->map(fn (string $label, string $value) => [
                            'value' => $value,
                            'label' => $label,
                            'description' => Periode::programSubtypeDescriptions()[$value] ?? null,
                        ])->values(),
                ];

                Cache::put($cacheKey, $options, 3600);

                return $options;
            }),
            'aiInsights' => Inertia::defer(function () {
                try {
                    if (class_exists(AnonymousAgent::class)) {
                        return AnonymousAgent::make(
                            instructions: 'Anda adalah asisten admin KKN yang ahli dalam manajemen akademik namun komunikatif kepada publik.'
                        )->prompt('Berikan ringkasan singkat strategi manajemen untuk KKN periode 2026/2027 berdasarkan meta-data sistem. Gunakan bahasa Indonesia yang santun, jelas, dan mudah dimengerti oleh khalayak umum tanpa istilah teknis database.')
                            ->content();
                    }
                } catch (\Exception $e) {
                    return 'AI Insight sedang tidak tersedia.';
                }

                return null;
            }),
        ]);
    }

    public function show(Periode $periode): Response
    {
        Gate::authorize('manage-master-data');

        $periode->load(['tahunAkademik']);

        $stats = [
            'total_students' => DB::table('peserta_kkn')->where('periode_id', $periode->id)->count(),
            'total_groups' => DB::table('kelompok_kkn')->where('periode_id', $periode->id)->count(),
            'total_locations' => DB::table('kelompok_kkn')
                ->where('periode_id', $periode->id)
                ->whereNotNull('location_id')
                ->distinct('location_id')
                ->count('location_id'),
        ];

        return Inertia::render('Admin/MasterData/Periods/Show', [
            'period' => [
                'id' => $periode->id,
                'name' => $periode->name,
                'academic_year' => $periode->tahunAkademik ? [
                    'id' => $periode->tahunAkademik->id,
                    'name' => $periode->tahunAkademik->year,
                ] : ['name' => '—'],
                'registration_start' => $periode->registration_start?->format('Y-m-d'),
                'registration_end' => $periode->registration_end?->format('Y-m-d'),
                'execution_start' => $periode->start_date?->format('Y-m-d'),
                'execution_end' => $periode->end_date?->format('Y-m-d'),
                'grading_start' => $periode->grading_start?->format('Y-m-d'),
                'grading_end' => $periode->grading_end?->format('Y-m-d'),
                'status_kkn' => $periode->current_phase ?: 'pelaksanaan',
                'description' => $periode->jenis_kkn?->description,
                'is_active' => $periode->is_active,
                'stats' => $stats,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        try {
            $validated = $this->validatedPayload($request);
            $this->periodeService->store($validated);

            return redirect()->route('admin.periode.index')->with('success', 'Periode KKN berhasil ditambahkan.');
        } catch (\DomainException $e) {
            return redirect()->back()->withErrors(['start_date' => $e->getMessage()])->withInput();
        } catch (\Exception $e) {
            Log::error('Periode Store Error: '.$e->getMessage(), [
                'payload' => $request->except(['_token']),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->back()->withErrors(['name' => 'Gagal menyimpan data: '.$e->getMessage()])->withInput();
        }
    }

    public function update(Request $request, Periode $periode): RedirectResponse
    {
        try {
            $validated = $this->validatedPayload($request);
            $this->periodeService->update($periode, $validated);

            return redirect()->route('admin.periode.index')->with('success', 'Periode KKN berhasil diperbarui.');
        } catch (\DomainException $e) {
            return redirect()->back()->withErrors(['start_date' => $e->getMessage()])->withInput();
        } catch (\Exception $e) {
            Log::error('Periode Update Error: '.$e->getMessage(), [
                'id' => $periode->id,
                'payload' => $request->except(['_token']),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->back()->withErrors(['name' => 'Gagal memperbarui data: '.$e->getMessage()])->withInput();
        }
    }

    public function duplicate(Periode $periode): RedirectResponse
    {
        try {
            $this->periodeService->duplicate($periode);

            return redirect()->route('admin.periode.index')->with('success', 'Struktur periode dan kelompok berhasil diduplikasi.');
        } catch (\Exception $e) {
            return redirect()->route('admin.periode.index')->with('error', 'Gagal menduplikasi periode: '.$e->getMessage());
        }
    }

    public function destroy(Periode $periode): RedirectResponse
    {
        try {
            $this->periodeService->delete($periode);

            return redirect()->route('admin.periode.index')->with('success', 'Periode KKN berhasil dihapus.');
        } catch (\DomainException $e) {
            return redirect()->route('admin.periode.index')->with('error', $e->getMessage());
        } catch (\Exception $e) {
            return redirect()->route('admin.periode.index')->with('error', 'Gagal menghapus periode: '.$e->getMessage());
        }
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
            'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => '2563EB']],
        ];
        $sheet->getStyle('A1:O1')->applyFromArray($headerStyle);

        $row = 2;
        foreach ($periods as $index => $period) {
            $sheet->setCellValue("A{$row}", $index + 1);
            $sheet->setCellValue("B{$row}", $period->name);
            $sheet->setCellValue("C{$row}", $period->tahunAkademik?->year ?? '-');
            $sheet->setCellValue("D{$row}", $period->jenisKkn?->name ?? '-');
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

        $tempFile = $exportDir.'/'.Str::uuid().'.xlsx';
        try {
            $writer->save($tempFile);

            return response()->download($tempFile, $filename)->deleteFileAfterSend(true);
        } catch (\Throwable $e) {
            if (file_exists($tempFile)) {
                unlink($tempFile);
            }
            Log::error('Periode export failed', ['exception' => $e]);
            abort(500, 'Gagal mengekspor data periode.');
        }
    }
}
