<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Exports\LokasiExport;
use App\Exports\LokasiTemplateExport;
use App\Http\Controllers\Controller;
use App\Imports\LokasiWilayahImport;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Periode;
use App\Models\KKN\PoskoKelompok;
use App\Services\PeriodContextService;
use App\Traits\HandlesPagination;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;

class LokasiController extends Controller
{
    use HandlesPagination;

    public function index(Request $request): Response
    {
        Gate::authorize('manage-master-data');

        $periodId = $request->query('period_id')
            ? (int) $request->query('period_id')
            : app(PeriodContextService::class)->getActivePeriodId();
        $period = $periodId ? Periode::find($periodId) : null;

        $locations = Lokasi::query()
            ->withCount([
                'kelompok' => fn ($query) => $query->when($periodId, fn ($q) => $q->where('periode_id', $periodId)),
                'kelompok as posko_count' => fn ($query) => $query
                    ->when($periodId, fn ($q) => $q->where('periode_id', $periodId))
                    ->has('posko'),
            ])
            ->when($request->search, function ($query, $search) {
                $s = str_replace(['%', '_'], ['\\%', '\\_'], $search);

                $query->where(function ($innerQuery) use ($s) {
                    $innerQuery->where('village_name', 'like', "%{$s}%")
                        ->orWhere('district_name', 'like', "%{$s}%")
                        ->orWhere('regency_name', 'like', "%{$s}%")
                        ->orWhere('village_code', 'like', "%{$s}%");
                });
            })
            ->orderBy('regency_name')
            ->orderBy('district_name')
            ->orderBy('village_name')
            ->paginate(15)
            ->withQueryString();

        $locations->through(fn ($location) => [
            'id' => $location->id,
            'village_code' => $location->village_code,
            'village_name' => $location->village_name,
            'district_name' => $location->district_name,
            'regency_name' => $location->regency_name,
            'capacity' => $location->capacity,
            'full_name' => $location->full_name,
            'groups_count' => $location->kelompok_count,
            'posko_count' => $location->posko_count,
            'is_used_in_period' => $periodId ? $location->kelompok_count > 0 : false,
            'can_delete' => $this->canDeleteLocation($location),
            'delete_blocker' => $this->getDeleteBlockerReason($location),
        ]);

        $groupsQuery = KelompokKkn::query();
        $poskoQuery = PoskoKelompok::query();
        if ($periodId) {
            $groupsQuery->where('periode_id', $periodId);
            $poskoQuery->whereHas('kelompok', fn ($q) => $q->where('periode_id', $periodId));
        }

        return Inertia::render('Admin/Operational/Locations/Index', [
            'locations' => $this->formatPaginator($locations),
            'filters' => $request->only('search', 'period_id'),
            'summary' => [
                'total_locations' => Lokasi::count(),
                'assigned_groups' => $groupsQuery->count(),
                'reported_posko' => $poskoQuery->count(),
            ],
            'workflow' => [
                'primary_source' => 'groups_import',
                'groups_import_url' => '/admin/kelompok',
            ],
            'periods' => Inertia::defer(fn () => Periode::orderByDesc('is_active')->orderByDesc('periode')->get(['id', 'name', 'periode'])),
            'active_periode_id' => $periodId,
            'active_periode_name' => $period?->name,
        ]);
    }

    public function export(Request $request)
    {
        Gate::authorize('manage-master-data');

        $periodId = PeriodContextService::getPeriodId($request->query('period_id'));

        $query = Lokasi::query()
            ->withCount([
                'kelompok' => fn ($query) => $query->when($periodId, fn ($q) => $q->where('periode_id', $periodId)),
                'kelompok as posko_count' => fn ($query) => $query
                    ->when($periodId, fn ($q) => $q->where('periode_id', $periodId))
                    ->has('posko'),
            ])
            ->orderBy('regency_name')
            ->orderBy('district_name')
            ->orderBy('village_name');

        if ($request->search) {
            $s = str_replace(['%', '_'], ['\\%', '\\_'], $request->search);
            $query->where(function ($innerQuery) use ($s) {
                $innerQuery->where('village_name', 'like', "%{$s}%")
                    ->orWhere('district_name', 'like', "%{$s}%")
                    ->orWhere('regency_name', 'like', "%{$s}%")
                    ->orWhere('village_code', 'like', "%{$s}%");
            });
        }

        return Excel::download(new LokasiExport($query), 'data_lokasi_kkn_'.now()->format('Ymd_His').'.xlsx');
    }

    public function downloadTemplate()
    {
        Gate::authorize('manage-master-data');

        return Excel::download(new LokasiTemplateExport, 'template_impor_lokasi.xlsx');
    }

    public function import(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'file' => [
                'required', 
                'file', 
                'mimetypes:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,text/plain',
                'mimes:xlsx,xls,csv,txt', 
                'max:10240'
            ],
        ], [
            'file.mimetypes' => 'Format file harus berupa Excel (XLSX/XLS) atau CSV yang valid.',
        ]);

        $import = new LokasiWilayahImport;
        Excel::import($import, $validated['file']);

        return redirect()->back()->with(
            'success',
            "Import lokasi selesai. {$import->createdCount} data baru, {$import->updatedCount} data diperbarui, {$import->skippedCount} baris kosong dilewati."
        );
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'village_name' => ['required', 'string', 'max:100'],
            'district_name' => ['required', 'string', 'max:100'],
            'regency_name' => ['required', 'string', 'max:100'],
            'village_code' => ['nullable', 'string', 'max:20'],
            'capacity' => ['nullable', 'integer', 'min:0'],
        ]);

        Lokasi::create([
            'village_name' => $validated['village_name'],
            'district_name' => $validated['district_name'],
            'regency_name' => $validated['regency_name'],
            'village_code' => $validated['village_code'] ?? null,
            'capacity' => $validated['capacity'] ?? 0,
        ]);

        return redirect()->back()->with('success', 'Lokasi administratif berhasil ditambahkan.');
    }

    public function update(Request $request, Lokasi $lokasi): RedirectResponse
    {
        $validated = $request->validate([
            'village_name' => ['required', 'string', 'max:100'],
            'district_name' => ['required', 'string', 'max:100'],
            'regency_name' => ['required', 'string', 'max:100'],
            'village_code' => ['nullable', 'string', 'max:20'],
            'capacity' => ['nullable', 'integer', 'min:0'],
        ]);

        $lokasi->update([
            'village_name' => $validated['village_name'],
            'district_name' => $validated['district_name'],
            'regency_name' => $validated['regency_name'],
            'village_code' => $validated['village_code'] ?? null,
            'capacity' => $validated['capacity'] ?? $lokasi->capacity,
        ]);

        return redirect()->route('admin.locations.index')->with('success', 'Lokasi administratif berhasil diperbarui.');
    }

    public function destroy(Lokasi $lokasi): RedirectResponse
    {
        $lokasi->loadCount('kelompok');

        if (! $this->canDeleteLocation($lokasi)) {
            return redirect()->back()->with('error', $this->getDeleteBlockerReason($lokasi));
        }

        $lokasi->delete();

        return redirect()->route('admin.locations.index')->with('success', 'Lokasi administratif berhasil dihapus.');
    }

    private function canDeleteLocation(Lokasi $location): bool
    {
        return (int) ($location->kelompok_count ?? 0) === 0;
    }

    private function getDeleteBlockerReason(Lokasi $location): ?string
    {
        if ((int) ($location->kelompok_count ?? 0) > 0) {
            return 'Lokasi tidak dapat dihapus karena masih dipakai oleh kelompok KKN.';
        }

        return null;
    }
}
