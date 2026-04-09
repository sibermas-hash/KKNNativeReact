<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\Workshop;
use App\Models\KKN\PesertaWorkshop;
use App\Models\KKN\Dosen;
use App\Models\KKN\Periode;
use App\Services\PeriodContextService;
use App\Services\WorkshopService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class WorkshopController extends Controller
{
    public function __construct(
        protected WorkshopService $workshopService,
        protected PeriodContextService $periodContextService,
    ) {}

    private function authorizeWorkshopManagement(): void
    {
        if (! auth()->user()->hasAnyRole(['superadmin', 'admin', 'faculty_admin'])) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengelola workshop.');
        }
    }

    public function index(Request $request): Response
    {
        $this->authorizeWorkshopManagement();

        $supportsPeriods = Workshop::supportsPeriodAssignment();
        $selectedPeriodId = $supportsPeriods
            ? (int) ($request->integer('period_id') ?: ($this->periodContextService->getActivePeriodId() ?? $this->periodContextService->getDefaultPeriodId()))
            : null;
        $workshops = $this->workshopService->getUpcomingWorkshops(null, true, true, $selectedPeriodId);

        return Inertia::render('Admin/Workshops/Index', [
            'workshops' => $workshops,
            'periods' => $supportsPeriods
                ? Periode::query()
                    ->orderByDesc('is_active')
                    ->orderByDesc('start_date')
                    ->get(['id', 'name'])
                    ->map(fn (Periode $period) => [
                        'id' => $period->id,
                        'name' => $period->name,
                    ])->values()
                : [],
            'filters' => [
                'period_id' => $selectedPeriodId,
            ],
            'workflow' => [
                'period_scoped' => $supportsPeriods,
            ],
            'summary' => [
                'total_workshops' => count($workshops),
                'scheduled_workshops' => collect($workshops)->where('status', 'scheduled')->count(),
                'cancelled_workshops' => collect($workshops)->where('status', 'cancelled')->count(),
                'total_registered' => collect($workshops)->sum('registered'),
                'total_attended' => collect($workshops)
                    ->sum(fn (array $workshop) => collect($workshop['participants'] ?? [])->where('attendance_status', 'attended')->count()),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeWorkshopManagement();

        $validated = $request->validate([
            'period_id' => Workshop::supportsPeriodAssignment() ? ['nullable', 'exists:periode,id'] : ['nullable'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'methodology' => ['nullable', 'string', 'max:100'],
            'workshop_date' => ['required', 'date'],
            'start_time' => ['nullable', 'string'],
            'end_time' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
            'max_participants' => ['nullable', 'integer', 'min:1'],
        ]);

        if (Workshop::supportsPeriodAssignment()) {
            $validated['period_id'] = $validated['period_id']
                ?? $this->periodContextService->getActivePeriodId()
                ?? $this->periodContextService->getDefaultPeriodId();
        }

        $this->workshopService->createWorkshop($validated);

        return redirect()->back()->with('success', 'Jadwal pembekalan berhasil ditambahkan.');
    }

    public function update(Request $request, Workshop $workshop): RedirectResponse
    {
        $this->authorizeWorkshopManagement();

        $validated = $request->validate([
            'period_id' => Workshop::supportsPeriodAssignment() ? ['nullable', 'exists:periode,id'] : ['nullable'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'methodology' => ['nullable', 'string', 'max:100'],
            'workshop_date' => ['required', 'date'],
            'start_time' => ['nullable', 'string'],
            'end_time' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
            'max_participants' => ['nullable', 'integer', 'min:1'],
        ]);

        if (Workshop::supportsPeriodAssignment()) {
            $validated['period_id'] = $validated['period_id'] ?? $workshop->period_id;
        }

        try {
            $this->workshopService->updateWorkshop($workshop, $validated);
            return redirect()->back()->with('success', 'Jadwal pembekalan berhasil diperbarui.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function bulkAttendance(Request $request, Workshop $workshop): RedirectResponse
    {
        $this->authorizeWorkshopManagement();

        $validated = $request->validate([
            'user_ids' => ['required', 'array'],
            'user_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $this->workshopService->bulkMarkAttendance($workshop->id, $validated['user_ids']);

        return redirect()->back()->with('success', 'Status kehadiran workshop berhasil diperbarui secara massal.');
    }

    public function previewAttendance(Request $request, int $workshopId): \Illuminate\Http\JsonResponse
    {
        $this->authorizeWorkshopManagement();

        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
        ]);

        $rows = \Maatwebsite\Excel\Facades\Excel::toArray(new \stdClass(), $request->file('file'));
        $data = $rows[0] ?? [];
        
        if (empty($data)) {
            return response()->json(['error' => 'File Excel kosong.'], 422);
        }

        $headers = array_map('strtolower', array_values($data[0]));
        $nipIndex = array_search('nip', $headers);

        if ($nipIndex === false) {
            return response()->json(['error' => 'Kolom "NIP" tidak ditemukan di baris pertama Excel.'], 422);
        }

        $results = [];
        $processedNips = [];

        for ($i = 1; $i < count($data); $i++) {
            $row = $data[$i];
            $nip = trim((string) ($row[$nipIndex] ?? ''));

            if (empty($nip) || in_array($nip, $processedNips)) continue;
            $processedNips[] = $nip;

            $dosen = Dosen::where('nip', $nip)->first();
            
            if (!$dosen) {
                $results[] = [
                    'nip' => $nip,
                    'name' => 'TIDAK DITEMUKAN',
                    'status' => 'error',
                    'message' => 'NIP tidak terdaftar di database master dosen.'
                ];
                continue;
            }

            if ($dosen->is_cpns) {
                $results[] = [
                    'nip' => $nip,
                    'name' => $dosen->nama,
                    'status' => 'error',
                    'message' => 'CPNS tidak diperbolehkan menjadi DPL.'
                ];
                continue;
            }

            if ($dosen->is_tugas_belajar) {
                $results[] = [
                    'nip' => $nip,
                    'name' => $dosen->nama,
                    'status' => 'error',
                    'message' => 'Sedang Tugas Belajar (Tidak Layak DPL).'
                ];
                continue;
            }

            $peserta = PesertaWorkshop::where('workshop_id', $workshopId)
                ->where('user_id', $dosen->user_id)
                ->first();

            if ($peserta && $peserta->attendance_status === 'attended') {
                $results[] = [
                    'nip' => $nip,
                    'name' => $dosen->nama,
                    'status' => 'info',
                    'message' => 'Sudah lulus kualifikasi workshop sebelumnya.'
                ];
            } else {
                $results[] = [
                    'nip' => $nip,
                    'name' => $dosen->nama,
                    'status' => 'success',
                    'message' => 'Layak & Siap di-import.'
                ];
            }
        }

        return response()->json([
            'preview' => $results,
            'summary' => [
                'total' => count($results),
                'valid' => count(array_filter($results, fn($r) => $r['status'] === 'success')),
            ]
        ]);
    }

    public function importAttendance(Request $request, int $workshopId): RedirectResponse
    {
        $this->authorizeWorkshopManagement();

        $validated = $request->validate([
            'nims' => ['required', 'array'],
            'nims.*' => ['string'],
        ]);

        $processedCount = 0;
        foreach ($validated['nims'] as $nip) {
            $dosen = Dosen::where('nip', $nip)->first();
            if ($dosen) {
                PesertaWorkshop::updateOrCreate(
                    ['workshop_id' => $workshopId, 'user_id' => $dosen->user_id],
                    [
                        'attendance_status' => 'attended',
                        'checked_in_at' => now(),
                        'registered_at' => now()
                    ]
                );
                $processedCount++;
            }
        }

        return redirect()->back()->with('success', "Berhasil memproses kualifikasi workshop. {$processedCount} dosen telah dicatat kehadirannya.");
    }

    public function destroy(Workshop $workshop): RedirectResponse
    {
        $this->authorizeWorkshopManagement();

        try {
            $this->workshopService->cancelWorkshop($workshop);
            return redirect()->back()->with('success', 'Pembekalan berhasil dibatalkan.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }
}
