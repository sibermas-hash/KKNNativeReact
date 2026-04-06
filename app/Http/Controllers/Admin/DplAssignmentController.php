<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Imports\DplAssignmentImport;
use App\Models\KKN\Dosen;
use App\Models\KKN\DplKecamatanAssignment;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\LogAudit;
use App\Models\KKN\Periode;
use App\Services\DplAssignmentService;
use App\Services\PeriodContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class DplAssignmentController extends Controller
{
    public function __construct(
        private PeriodContextService $contextService,
        private DplAssignmentService $assignmentService,
    ) {}

    private function logAudit(string $action, string $description, ?array $newValues = null): void
    {
        LogAudit::create([
            'user_id' => auth()->id(),
            'action' => $action,
            'description' => $description,
            'model_type' => 'DplPeriod',
            'severity' => 'info',
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'new_values' => $newValues,
        ]);
    }

    /**
     * Display the DPL assignment management page.
     */
    public function index(Request $request)
    {
        Gate::authorize('manage-master-data');
        
        $search = trim((string) $request->input('search', ''));
        $escapedSearch = str_replace(['%', '_'], ['\\%', '\\_'], $search);

        $assignments = DplPeriod::with([
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
            ->get();

        $groups = KelompokKkn::with([
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
            ->get();

        $allDosen = Dosen::with(['user.workshops' => function($q) {
                $q->where('attended', true);
            }])
            ->orderBy('nama')
            ->get();

        // ... rest of data fetching ...

        return Inertia::render('Admin/Dpl/Assignment', [
            // ... assignments, groups ...
            'allDosen' => $allDosen->map(fn (Dosen $dosen) => [
                'id' => $dosen->id,
                'nama' => $dosen->nama,
                'nip' => $dosen->nip,
                'is_cpns' => (bool) $dosen->is_cpns,
                'is_tugas_belajar' => (bool) $dosen->is_tugas_belajar,
                'is_workshop_passed' => $dosen->user?->workshops?->isNotEmpty() ?? false,
            ])->values(),
            'allPeriods' => $allPeriods->map(fn (Periode $period) => [
                'id' => $period->id,
                'name' => $period->name,
                'periode' => $period->periode,
                'jenis' => $period->jenis,
            ])->values(),
            'districts' => $districts->map(fn (Lokasi $district) => [
                'district_id' => (string) $district->district_id,
                'district_name' => $district->district_name,
                'regency_name' => $district->regency_name,
            ])->values(),
            'districtCoordinators' => $districtCoordinators->map(fn (DplKecamatanAssignment $assignment) => [
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
            ])->values(),
            'filters' => $request->only('search'),
            'title' => 'Penugasan DPL',
            'workflow' => [
                'has_locations' => Lokasi::query()->exists(),
                'has_groups' => KelompokKkn::query()->exists(),
            ],
        ]);
    }

    public function assignToPeriod(Request $request)
    {
        Gate::authorize('manageDplAssignment', new \App\Models\User());

        $validated = $request->validate([
            'dosen_id' => 'required|exists:dosen,id',
            'period_id' => 'required|exists:periode,id',
            'max_groups' => 'integer|min:1|max:20',
        ]);

        $dosen = Dosen::query()->findOrFail($validated['dosen_id']);
        $period = Periode::query()->findOrFail($validated['period_id']);
        $activation = $this->assignmentService->activateForPeriod($dosen, $period, (int) ($validated['max_groups'] ?? 5));

        $this->logAudit(
            'assign_dpl_period',
            "DPL {$dosen->nama} (NIP: {$dosen->nip}) diaktifkan pada periode {$period->name}",
            [
                'dosen_id' => $dosen->id,
                'dosen_nama' => $dosen->nama,
                'period_id' => $period->id,
                'period_name' => $period->name,
                'max_groups' => $validated['max_groups'] ?? 5,
                'account_created' => $activation['provisioning']['created'] ?? false,
            ]
        );

        $message = "DPL {$dosen->nama} berhasil diaktifkan pada periode {$period->name}.";
        if ($activation['provisioning']['temp_password']) {
            $message .= " Akun login dibuat dengan username {$activation['provisioning']['user']->username} dan kata sandi sementara {$activation['provisioning']['temp_password']}. DPL wajib mengganti kata sandi saat login pertama.";
        }

        return back()->with('success', $message);
    }

    /**
     * Assign a DPL-Period entry to a group.
     */
    public function assignToGroup(Request $request, KelompokKkn $group)
    {
        Gate::authorize('manageDplAssignment', new \App\Models\User());

        $validated = $request->validate([
            'dpl_period_id' => 'required|exists:dpl_periods,id',
        ]);

        $dplPeriod = DplPeriod::findOrFail($validated['dpl_period_id']);

        try {
            $this->assignmentService->assignPrimaryGroup($dplPeriod, $group);

            $this->logAudit(
                'assign_group_to_dpl',
                "Kelompok {$group->nama_kelompok} ({$group->code}) ditugaskan kepada DPL {$dplPeriod->dosen->nama}",
                [
                    'group_id' => $group->id,
                    'group_code' => $group->code,
                    'group_name' => $group->nama_kelompok,
                    'dpl_id' => $dplPeriod->dosen_id,
                    'dpl_periode_id' => $dplPeriod->id,
                ]
            );
        } catch (\DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'DPL berhasil ditugaskan ke kelompok.');
    }

    public function assignDistrictCoordinator(Request $request)
    {
        Gate::authorize('manageDplAssignment', new \App\Models\User());

        $validated = $request->validate([
            'dosen_id' => 'required|exists:dosen,id',
            'period_id' => 'required|exists:periode,id',
            'district_id' => 'required|string',
            'max_groups' => 'nullable|integer|min:1|max:20',
        ]);

        $dosen = Dosen::query()->findOrFail($validated['dosen_id']);
        $period = Periode::query()->findOrFail($validated['period_id']);
        $district = Lokasi::query()
            ->where('district_id', $validated['district_id'])
            ->select('district_id', 'district_name', 'regency_name')
            ->first();

        if (!$district) {
            return back()->with('error', 'Kecamatan tidak ditemukan pada master lokasi.');
        }

        $activation = $this->assignmentService->activateForPeriod($dosen, $period, (int) ($validated['max_groups'] ?? 5));
        $this->assignmentService->assignDistrictCoordinator(
            $activation['assignment'],
            (string) $district->district_id,
            $district->district_name,
            $district->regency_name,
            auth()->id(),
        );

        $this->logAudit(
            'assign_district_coordinator',
            "DPL {$dosen->nama} (NIP: {$dosen->nip}) ditetapkan sebagai koordinator kecamatan {$district->district_name}",
            [
                'dosen_id' => $dosen->id,
                'dosen_nama' => $dosen->nama,
                'period_id' => $period->id,
                'period_name' => $period->name,
                'district_id' => $district->district_id,
                'district_name' => $district->district_name,
                'regency_name' => $district->regency_name,
            ]
        );

        $message = "Koordinator DPL untuk kecamatan {$district->district_name} berhasil ditetapkan.";
        if ($activation['provisioning']['temp_password']) {
            $message .= " Akun login dibuat dengan username {$activation['provisioning']['user']->username} dan kata sandi sementara {$activation['provisioning']['temp_password']}.";
        }

        return back()->with('success', $message);
    }

    public function removeDistrictCoordinator(DplKecamatanAssignment $districtCoordinator)
    {
        Gate::authorize('manageDplAssignment', new \App\Models\User());

        $districtCoordinator->update(['is_active' => false]);

        $this->logAudit(
            'remove_district_coordinator',
            "Koordinator DPL {$districtCoordinator->dosen->nama} untuk kecamatan {$districtCoordinator->district_name} dinonaktifkan",
            [
                'dosen_id' => $districtCoordinator->dosen_id,
                'district_id' => $districtCoordinator->district_id,
                'district_name' => $districtCoordinator->district_name,
            ]
        );

        return back()->with('success', 'Koordinator kecamatan berhasil dinonaktifkan.');
    }

    public function import(Request $request)
    {
        if (! KelompokKkn::query()->exists()) {
            return back()->with('error', 'Import penugasan DPL belum bisa dilakukan. Import kelompok terlebih dahulu.');
        }

        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv,txt', 'max:10240'],
        ]);

        $import = new DplAssignmentImport($this->assignmentService);
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

    /**
     * Get available DPLs for the active period with remaining capacity.
     */
    public function getAvailableDpl()
    {
        Gate::authorize('manage-master-data');

        $periodId = $this->contextService->getActivePeriodId();

        if (!$periodId) {
            return response()->json([]);
        }

        $dplList = Dosen::availableForPeriod($periodId)
            ->with(['dplPeriods' => function ($q) use ($periodId) {
                $q->where('period_id', $periodId);
            }])
            ->get()
            ->map(function ($dosen) use ($periodId) {
                $dplPeriod = $dosen->dplPeriods->first();
                return [
                    'id' => $dosen->id,
                    'nama' => $dosen->nama,
                    'nip' => $dosen->nip,
                    'dpl_period_id' => $dplPeriod?->id,
                    'max_groups' => $dplPeriod?->max_groups,
                    'current_groups' => $dplPeriod?->kelompok()->count() ?? 0,
                    'remaining_slots' => $dplPeriod?->getRemainingSlots() ?? 0,
                ];
            });

        return response()->json($dplList);
    }

    /**
     * Remove DPL assignment from a period.
     */
    public function removeDplFromPeriod(DplPeriod $dplPeriod)
    {
        Gate::authorize('manageDplAssignment', new \App\Models\User());

        // Check if DPL has assigned groups
        if ($dplPeriod->kelompok()->count() > 0) {
            return back()->with('error', 'Tidak dapat menghapus DPL yang masih memiliki kelompok aktif.');
        }

        $dplPeriod->update(['is_active' => false]);

        $this->logAudit(
            'remove_dpl_period',
            "DPL {$dplPeriod->dosen->nama} dihapus dari periode {$dplPeriod->periode->name}",
            [
                'dosen_id' => $dplPeriod->dosen_id,
                'period_id' => $dplPeriod->period_id,
            ]
        );

        return back()->with('success', 'DPL berhasil dihapus dari periode.');
    }
}
