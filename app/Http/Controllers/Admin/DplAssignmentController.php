<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Constants\AppConstants;
use App\Http\Controllers\Controller;
use App\Imports\DplAssignmentImport;
use App\Models\KKN\Dosen;
use App\Models\KKN\DplKecamatanAssignment;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Periode;
use App\Services\Admin\DplAssignmentService;
use App\Services\PeriodContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

use App\Services\DplEligibilityService;

class DplAssignmentController extends Controller
{
    public function __construct(
        private PeriodContextService $contextService,
        private DplAssignmentService $assignmentService,
        private DplEligibilityService $eligibilityService,
    ) {}

    /**
     * Display the DPL assignment management page.
     */
    public function index(Request $request)
    {
        Gate::authorize('manageDplAssignment');

        $search = trim((string) $request->input('search', ''));
        $escapedSearch = str_replace(['%', '_'], ['\\%', '\\_'], $search);

        $assignmentsPaginated = DplPeriod::with([
            'dosen:id,nama,nip',
            'periode:id,name,periode,jenis',
        ])
            ->withCount('kelompok')
            ->where('is_active', true)
            ->when($search !== '', function ($query) use ($escapedSearch) {
                $query->where(function ($builder) use ($escapedSearch) {
                    $builder->whereHas('dosen', function ($dosenQuery) use ($escapedSearch) {
                        $dosenQuery
                            ->where('nama', 'like', "%{$escapedSearch}%")
                            ->orWhere('nip', 'like', "%{$escapedSearch}%");
                    })->orWhereHas('periode', function ($periodQuery) use ($escapedSearch) {
                        $periodQuery
                            ->where('name', 'like', "%{$escapedSearch}%")
                            ->orWhere('jenis', 'like', "%{$escapedSearch}%");
                    });
                });
            })
            ->orderByDesc('created_at')
            ->paginate(AppConstants::MAX_BATCH_LIMIT);

        $groupsPaginated = KelompokKkn::with([
            'dpl:id,nama,nip',
            'periode:id,name,periode,jenis',
            'lokasi:id,district_name,regency_name',
        ])
            ->when($search !== '', function ($query) use ($escapedSearch) {
                $query->where(function ($builder) use ($escapedSearch) {
                    $builder
                        ->where('nama_kelompok', 'like', "%{$escapedSearch}%")
                        ->orWhere('code', 'like', "%{$escapedSearch}%")
                        ->orWhereHas('dpl', function ($dosenQuery) use ($escapedSearch) {
                            $dosenQuery
                                ->where('nama', 'like', "%{$escapedSearch}%")
                                ->orWhere('nip', 'like', "%{$escapedSearch}%");
                        })
                        ->orWhereHas('periode', function ($periodQuery) use ($escapedSearch) {
                            $periodQuery->where('name', 'like', "%{$escapedSearch}%");
                        });
                });
            })
            ->orderBy('nama_kelompok')
            ->paginate(100);

        $allDosen = Dosen::query()
            ->orderBy('nama')
            ->get(['id', 'user_id', 'nama', 'nip', 'is_cpns', 'is_tugas_belajar']);

        $allPeriods = Periode::query()
            ->orderByDesc('is_active')
            ->orderByDesc('start_date')
            ->get(['id', 'name', 'periode', 'jenis']);

        $districts = Lokasi::query()
            ->whereNotNull('district_id')
            ->whereNotNull('district_name')
            ->selectRaw('district_id, district_name, regency_name, COUNT(*) as sub_districts_count')
            ->groupBy('district_id', 'district_name', 'regency_name')
            ->orderBy('district_name')
            ->get();

        $districtCoordinatorsPaginated = DplKecamatanAssignment::with([
            'dosen:id,nama,nip',
            'periode:id,name,periode,jenis',
        ])
            ->where('is_active', true)
            ->when($search !== '', function ($query) use ($escapedSearch) {
                $query->where(function ($builder) use ($escapedSearch) {
                    $builder
                        ->where('district_name', 'like', "%{$escapedSearch}%")
                        ->orWhere('regency_name', 'like', "%{$escapedSearch}%")
                        ->orWhereHas('dosen', function ($dosenQuery) use ($escapedSearch) {
                            $dosenQuery
                                ->where('nama', 'like', "%{$escapedSearch}%")
                                ->orWhere('nip', 'like', "%{$escapedSearch}%");
                        })
                        ->orWhereHas('periode', function ($periodQuery) use ($escapedSearch) {
                            $periodQuery->where('name', 'like', "%{$escapedSearch}%");
                        });
                });
            })
            ->orderBy('district_name')
            ->paginate(AppConstants::MAX_BATCH_LIMIT);

        $districtCoordinatorRows = $districtCoordinatorsPaginated->map(fn (DplKecamatanAssignment $assignment) => [
            'id' => $assignment->id,
            'district_id' => $assignment->district_id,
            'district_name' => $assignment->district_name,
            'regency_name' => $assignment->regency_name,
            'period' => [
                'id' => $assignment->periode?->id,
                'name' => $assignment->periode?->name ?? '-',
                'periode' => $assignment->periode?->periode,
                'jenis' => $assignment->periode?->jenis,
            ],
            'dosen' => [
                'id' => $assignment->dosen?->id,
                'nama' => $assignment->dosen?->nama ?? '-',
                'nip' => $assignment->dosen?->nip ?? '-',
            ],
        ])->values();

        $currentCoordinatorRows = $districtCoordinatorsPaginated->map(fn (DplKecamatanAssignment $assignment) => [
            'id' => $assignment->id,
            'district' => [
                'id' => (string) $assignment->district_id,
                'name' => $assignment->district_name,
            ],
            'dpl_period' => [
                'id' => $assignment->dpl_period_id,
                'dosen' => [
                    'nama' => $assignment->dosen?->nama ?? '-',
                ],
            ],
        ])->values();

        return Inertia::render('Admin/Operational/Dpl/Assignment', [
            'assignments' => $assignmentsPaginated->getCollection()->map(fn (DplPeriod $assignment) => [
                'id' => $assignment->id,
                'max_groups' => $assignment->max_groups,
                'current_groups' => $assignment->kelompok_count,
                'remaining_slots' => max(0, $assignment->max_groups - $assignment->kelompok_count),
                'is_active' => (bool) $assignment->is_active,
                'dosen' => [
                    'id' => $assignment->dosen?->id,
                    'nama' => $assignment->dosen?->nama ?? '-',
                    'nip' => $assignment->dosen?->nip ?? '-',
                ],
                'period' => [
                    'id' => $assignment->periode?->id,
                    'name' => $assignment->periode?->name ?? '-',
                    'periode' => $assignment->periode?->periode,
                    'jenis' => $assignment->periode?->jenis,
                ],
            ])->values(),
            'assignments_pagination' => [
                'current_page' => $assignmentsPaginated->currentPage(),
                'last_page' => $assignmentsPaginated->lastPage(),
                'per_page' => $assignmentsPaginated->perPage(),
                'total' => $assignmentsPaginated->total(),
            ],
            'groups' => Inertia::defer(fn () => $groupsPaginated->getCollection()->map(fn (KelompokKkn $group) => [
                'id' => $group->id,
                'name' => $group->nama_kelompok,
                'code' => $group->code,
                'status' => $group->status,
                'dpl_period_id' => $group->dpl_period_id,
                'period' => [
                    'id' => $group->periode?->id,
                    'name' => $group->periode?->name ?? '-',
                    'periode' => $group->periode?->periode,
                    'jenis' => $group->periode?->jenis,
                ],
                'location' => [
                    'village_name' => $group->lokasi?->village_name,
                    'district_name' => $group->lokasi?->district_name,
                    'regency_name' => $group->lokasi?->regency_name,
                ],
                'dpl' => $group->dpl ? [
                    'id' => $group->dpl->id,
                    'nama' => $group->dpl->nama,
                    'nip' => $group->dpl->nip,
                ] : null,
            ])->values()),
            'groups_pagination' => [
                'current_page' => $groupsPaginated->currentPage(),
                'last_page' => $groupsPaginated->lastPage(),
                'per_page' => $groupsPaginated->perPage(),
                'total' => $groupsPaginated->total(),
            ],
            'allDosen' => Inertia::defer(fn () => $allDosen->map(function (Dosen $dosen) {
                $check = $this->eligibilityService->isQualifiedForDpl($dosen);
                return [
                    'id' => $dosen->id,
                    'nama' => $dosen->nama,
                    'nip' => $dosen->nip,
                    'is_cpns' => (bool) $dosen->is_cpns,
                    'is_tugas_belajar' => (bool) $dosen->is_tugas_belajar,
                    'is_qualified' => $check['eligible'],
                    'qualification_reason' => $check['reason'],
                ];
            })->values()),
            'allPeriods' => Inertia::defer(fn () => $allPeriods->map(fn (Periode $period) => [
                'id' => $period->id,
                'name' => $period->name,
                'periode' => $period->periode,
                'jenis' => $period->jenis,
            ])->values()),
            'districts' => Inertia::defer(fn () => $districts->map(fn (Lokasi $district) => [
                'id' => (string) $district->district_id,
                'name' => $district->district_name,
                'sub_districts_count' => (int) ($district->sub_districts_count ?? 0),
                'district_id' => (string) $district->district_id,
                'district_name' => $district->district_name,
                'regency_name' => $district->regency_name,
            ])->values()),
            'districtCoordinators' => Inertia::defer(fn () => $districtCoordinatorRows),
            'currentCoordinators' => Inertia::defer(fn () => $currentCoordinatorRows),
            'coordinators_pagination' => [
                'current_page' => $districtCoordinatorsPaginated->currentPage(),
                'last_page' => $districtCoordinatorsPaginated->lastPage(),
                'per_page' => $districtCoordinatorsPaginated->perPage(),
                'total' => $districtCoordinatorsPaginated->total(),
            ],
            'filters' => $request->only('search'),
            'title' => 'Penugasan DPL',
            'workflow' => [
                'has_locations' => Lokasi::query()->exists(),
                'has_groups' => KelompokKkn::query()->exists(),
            ],
            'summary' => Inertia::defer(fn () => [
                'active_assignments' => $assignmentsPaginated->total(),
                'groups_total' => $groupsPaginated->total(),
                'groups_without_dpl' => Cache::remember('dpl_summary_groups_without_dpl', 60, fn () => KelompokKkn::query()->whereNull('dpl_period_id')->count()),
                'active_groups_without_dpl' => Cache::remember('dpl_summary_active_groups_without_dpl', 60, fn () => KelompokKkn::query()->where('status', 'active')->whereNull('dpl_period_id')->count()),
                'district_coordinators' => $districtCoordinatorsPaginated->total(),
            ]),
        ]);
    }

    public function assignToPeriod(Request $request)
    {
        Gate::authorize('manageDplAssignment');

        $validated = $request->validate([
            'dosen_id' => 'required|exists:dosen,id',
            'period_id' => 'required|exists:periode,id',
            'max_groups' => 'integer|min:1|max:20',
        ]);

        $dosen = Dosen::query()->findOrFail($validated['dosen_id']);
        $period = Periode::query()->findOrFail($validated['period_id']);
        $activation = $this->assignmentService->activateForPeriod($dosen, $period, (int) ($validated['max_groups'] ?? 5));

        $message = "DPL {$dosen->nama} berhasil diaktifkan pada periode {$period->name}.";
        if ($activation['provisioning']['temp_password']) {
            $message .= " Akun login dibuat dengan username {$activation['provisioning']['user']->username} dan kata sandi sementara {$activation['provisioning']['temp_password']}. DPL wajib mengganti kata sandi saat login pertama.";
        }

        return back()->with('success', $message);
    }

    public function assignToGroup(Request $request, KelompokKkn $group)
    {
        Gate::authorize('manageDplAssignment');

        $validated = $request->validate([
            'dpl_period_id' => 'required|exists:dpl_periods,id',
        ]);

        $dplPeriod = DplPeriod::with('dosen')->findOrFail($validated['dpl_period_id']);

        if ($group->dpl_period_id === $dplPeriod->id) {
            return back()->with('info', "Kelompok {$group->nama_kelompok} sudah ditugaskan kepada DPL {$dplPeriod->dosen->nama}. Tidak ada perubahan.");
        }

        try {
            $this->assignmentService->assignToGroup($dplPeriod, $group);
        } catch (\DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'DPL berhasil ditugaskan ke kelompok.');
    }

    public function assignDistrictCoordinator(Request $request)
    {
        Gate::authorize('manageDplAssignment');

        $validated = $request->validate([
            'dpl_period_id' => 'nullable|exists:dpl_periods,id',
            'dosen_id' => 'nullable|exists:dosen,id',
            'period_id' => 'nullable|exists:periode,id',
            'district_id' => 'required|string',
            'max_groups' => 'nullable|integer|min:1|max:20',
        ]);

        try {
            if (! empty($validated['dpl_period_id'])) {
                $dplPeriod = DplPeriod::query()->with(['dosen', 'periode'])->findOrFail($validated['dpl_period_id']);
                $dosen = $dplPeriod->dosen;
                $period = $dplPeriod->periode;
            } else {
                $dosen = Dosen::query()->findOrFail($validated['dosen_id']);
                $period = Periode::query()->findOrFail($validated['period_id']);
            }

            $activation = $this->assignmentService->assignDistrictCoordinator(
                $dosen,
                $period,
                $validated['district_id'],
                (int) ($validated['max_groups'] ?? 5)
            );

            $message = 'Koordinator DPL untuk kecamatan berhasil ditetapkan.';
            if ($activation['provisioning']['temp_password']) {
                $message .= " Akun login dibuat dengan username {$activation['provisioning']['user']->username} and kata sandi sementara {$activation['provisioning']['temp_password']}.";
            }

            return back()->with('success', $message);
        } catch (\DomainException $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function removeDistrictCoordinator(DplKecamatanAssignment $districtCoordinator)
    {
        Gate::authorize('manageDplAssignment');

        $this->assignmentService->removeDistrictCoordinator($districtCoordinator);

        return back()->with('success', 'Koordinator kecamatan berhasil dinonaktifkan.');
    }

    public function import(Request $request)
    {
        Gate::authorize('manageDplAssignment');

        if (! KelompokKkn::query()->exists()) {
            return back()->with('error', 'Import penugasan DPL belum bisa dilakukan. Import kelompok terlebih dahulu.');
        }

        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv,txt', 'max:10240'],
        ]);

        // Using base service for import as it might be complex and already implemented there
        // but the import class might need the base service.
        $baseService = app(\App\Services\DplAssignmentService::class);
        $import = new DplAssignmentImport($baseService);
        Excel::import($import, $validated['file']);

        $message = "Import penugasan DPL selesai. {$import->activatedCount} aktivasi periode, {$import->groupAssignmentCount} penugasan kelompok, {$import->districtCoordinatorCount} koordinator kecamatan, {$import->provisionedAccountCount} akun baru.";

        if ($import->errors !== []) {
            $message .= ' Beberapa baris gagal: '.implode(' | ', array_slice($import->errors, 0, 5));
            if (count($import->errors) > 5) {
                $message .= ' ...';
            }
        }

        return back()->with($import->errors === [] ? 'success' : 'warning', $message);
    }

    public function getAvailableDpl()
    {
        Gate::authorize('manageDplAssignment');

        $periodId = $this->contextService->getActivePeriodId();

        if (! $periodId) {
            return response()->json([]);
        }

        $dplList = Dosen::availableForPeriod($periodId)
            ->with(['dplPeriods' => function ($q) use ($periodId) {
                $q->where('period_id', $periodId)
                    ->withCount('kelompok');
            }])
            ->get()
            ->map(function ($dosen) {
                $dplPeriod = $dosen->dplPeriods->first();

                return [
                    'id' => $dosen->id,
                    'nama' => $dosen->nama,
                    'nip' => $dosen->nip,
                    'dpl_period_id' => $dplPeriod?->id,
                    'max_groups' => $dplPeriod?->max_groups,
                    'current_groups' => $dplPeriod?->kelompok_count ?? 0,
                    'remaining_slots' => $dplPeriod ? max(0, $dplPeriod->max_groups - $dplPeriod->kelompok_count) : 0,
                ];
            });

        return response()->json($dplList);
    }

    public function removeDplFromPeriod(DplPeriod $dplPeriod)
    {
        Gate::authorize('manageDplAssignment');

        try {
            $this->assignmentService->removeDplFromPeriod($dplPeriod);

            return back()->with('success', 'DPL berhasil dihapus dari periode.');
        } catch (\DomainException $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
