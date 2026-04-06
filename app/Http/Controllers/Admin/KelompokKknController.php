<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Imports\KelompokKknImport;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Dosen;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Periode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use App\Traits\HandlesPagination;
use Maatwebsite\Excel\Facades\Excel;

class KelompokKknController extends Controller
{
    use HandlesPagination;

    private function normalizeLecturersPayload(Request $request): array
    {
        $lecturers = $request->input('lecturers');

        if (is_array($lecturers) && $lecturers !== []) {
            return $lecturers;
        }

        $dplPeriodId = $request->input('dpl_period_id');

        if (! $dplPeriodId) {
            return [];
        }

        $dplPeriod = DplPeriod::query()->find($dplPeriodId);

        if (! $dplPeriod) {
            return [];
        }

        return [[
            'id' => $dplPeriod->dosen_id,
            'role' => 'Ketua',
        ]];
    }

    private function prepareMutationPayload(Request $request): void
    {
        $request->merge([
            'name' => $request->input('name', $request->input('nama_kelompok')),
            'lecturers' => $this->normalizeLecturersPayload($request),
        ]);
    }

    public function index(Request $request): Response
    {
        Gate::authorize('manage-groups');
        
        $user = auth()->user();
        $isFacultyAdmin = $user?->hasRole('faculty_admin');
        $facultyId = $isFacultyAdmin ? $user?->faculty_id : null;

        $groups = KelompokKkn::with('periode', 'lokasi', 'dosen')
            ->withCount('peserta')
            ->when($request->input('search'), function ($query, $search) {
                $s = str_replace(['%', '_'], ['\\%', '\\_'], $search);
                $query->where(function ($q) use ($s) {
                    $q->where('nama_kelompok', 'like', "%{$s}%")
                      ->orWhere('code', 'like', "%{$s}%")
                      ->orWhereHas('lokasi', function ($locQuery) use ($s) {
                          $locQuery->where('village_name', 'like', "%{$s}%")
                                   ->orWhere('district_name', 'like', "%{$s}%");
                      })
                      ->orWhereHas('dosen', function ($dplQuery) use ($s) {
                          $dplQuery->where('nama', 'like', "%{$s}%");
                      });
                });
            })
            ->when($request->input('period_id'), function ($query, $periodId) {
                $query->where('period_id', $periodId);
            })
            ->when($request->input('status'), function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($facultyId, function ($query, $id) {
                $query->whereHas('peserta.mahasiswa', fn($q) => $q->where('faculty_id', $id));
            })
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        // Transform for frontend
        $groups->getCollection()->transform(function ($g) {
            $mainDpl = $g->dosen->where('pivot.role', 'Ketua')->first();
            $allDpls = $g->dosen->map(fn($d) => [
                'id' => $d->id,
                'name' => $d->nama,
                'role' => $d->pivot->role
            ])->values();

            return [
                'id' => $g->id,
                'code' => $g->code,
                'name' => $g->nama_kelompok,
                'capacity' => $g->capacity,
                'status' => $g->status,
                'registrations_count' => $g->peserta_count,
                'period' => $g->periode ? ['id' => $g->periode->id, 'name' => $g->periode->name] : null,
                'location' => $g->lokasi ? [
                    'id' => $g->lokasi->id,
                    'village_name' => $g->lokasi->village_name,
                    'full_name' => $g->lokasi->full_name,
                ] : null,
                'main_lecturer' => $mainDpl ? ['id' => $mainDpl->id, 'name' => $mainDpl->nama] : null,
                'lecturers' => $allDpls,
            ];
        });

        $periods = Periode::where('is_active', true)->orderByDesc('start_date')->get()
            ->map(fn($p) => ['id' => $p->id, 'name' => $p->name]);
        $locations = Lokasi::orderBy('village_name')->get()
            ->map(fn($l) => [
                'id' => $l->id,
                'village_name' => $l->village_name,
                'full_name' => $l->full_name,
            ]);
        $lecturers = Dosen::orderBy('nama')->get()
            ->map(fn($d) => ['id' => $d->id, 'name' => $d->nama]);

        return Inertia::render('Admin/Groups/Index', [
            'groups' => $this->formatPaginator($groups),
            'periods' => $periods,
            'locations' => $locations,
            'lecturers' => $lecturers,
            'filters' => $request->only('search', 'period_id', 'status'),
            'ui' => [
                'can_manage' => Gate::allows('manage-groups'),
            ],
            'workflow' => [
                'has_locations' => Lokasi::query()->exists(),
                'has_periods' => Periode::query()->exists(),
                'locations_managed_automatically' => true,
            ],
        ]);
    }

    public function show(KelompokKkn $kelompokKkn): Response
    {
        Gate::authorize('manage-groups');

        $kelompokKkn->load([
            'periode',
            'lokasi',
            'dosen',
            'peserta.mahasiswa',
            'programKerja',
            'posko',
        ]);

        return Inertia::render('Admin/Groups/Show', [
            'group' => $kelompokKkn,
            'members' => $kelompokKkn->peserta->values(),
        ]);
    }

    public function downloadTemplate()
    {
        Gate::authorize('manage-groups');

        $path = public_path('templates/template-import-kelompok.csv');

        abort_unless(file_exists($path), 404, 'Template import kelompok tidak ditemukan.');

        return response()->download($path, 'template-import-kelompok.csv');
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('manage-groups');

        $this->prepareMutationPayload($request);

        $validated = $request->validate([
            'period_id' => ['required', 'exists:periode,id'],
            'location_id' => ['required', 'exists:lokasi,id'],
            'dpl_period_id' => ['nullable', 'exists:dpl_periods,id'],
            'lecturers' => ['nullable', 'array'],
            'lecturers.*.id' => ['required', 'exists:dosen,id'],
            'lecturers.*.role' => ['required', 'in:Ketua,Anggota'],
            'name' => ['required', 'string', 'max:100'],
            'capacity' => ['required', 'integer', 'min:1', 'max:50'],
            'status' => ['required', 'in:draft,active,closed'],
        ]);

        // Proteksi: Validasi Kuota DPL & Peran Ketua
        if (!empty($validated['lecturers'])) {
            $ketuaCount = 0;
            foreach ($validated['lecturers'] as $l) {
                if ($l['role'] === 'Ketua') $ketuaCount++;

                $dplPeriod = \App\Models\KKN\DplPeriod::where('dosen_id', $l['id'])
                    ->where('period_id', $validated['period_id'])
                    ->where('is_active', true)
                    ->first();

                if (!$dplPeriod) {
                    $dosen = \App\Models\KKN\Dosen::find($l['id']);
                    return back()->withErrors(['lecturers' => "Dosen {$dosen->nama} belum terdaftar/aktif di periode ini."])->withInput();
                }

                if (!$dplPeriod->hasCapacity()) {
                    return back()->withErrors(['lecturers' => "Dosen {$dplPeriod->dosen->nama} sudah mencapai batas maksimal kelompok."])->withInput();
                }
            }

            if ($ketuaCount > 1) {
                return back()->withErrors(['lecturers' => 'Satu kelompok hanya boleh memiliki maksimal satu Ketua (DPL Utama).'])->withInput();
            }
        }

        $group = KelompokKkn::create([
            'period_id' => $validated['period_id'],
            'location_id' => $validated['location_id'],
            'nama_kelompok' => $validated['name'],
            'capacity' => $validated['capacity'],
            'status' => $validated['status'],
            'code' => 'KKN-' . strtoupper(Str::random(6)),
            'token' => strtoupper(Str::random(8)),
        ]);

        // Sync DPLs via Pivot Table & Sync Flat Columns
        if (!empty($validated['lecturers'])) {
            $syncData = [];
            foreach ($validated['lecturers'] as $l) {
                $syncData[$l['id']] = ['role' => $l['role']];
            }
            $group->dosen()->sync($syncData);
            $group->syncKetuaFlatColumns();
        }

        return redirect()->route('admin.kelompok.index')->with('success', 'Kelompok berhasil ditambahkan.');
        }

    public function import(Request $request): RedirectResponse
    {
        Gate::authorize('manage-groups');

        if (! Periode::query()->exists()) {
            return back()->with('error', 'Import kelompok belum bisa dilakukan. Buat periode KKN terlebih dahulu.');
        }

        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv,txt', 'max:10240'],
        ]);

        $import = new KelompokKknImport();
        Excel::import($import, $validated['file']);

        $message = "Import kelompok selesai. {$import->createdCount} data baru, {$import->updatedCount} data diperbarui, {$import->skippedCount} baris dilewati.";

        if ($import->errors !== []) {
            $message .= ' Beberapa baris gagal: '.implode(' | ', array_slice($import->errors, 0, 5));
            if (count($import->errors) > 5) {
                $message .= ' ...';
            }
        }

        return back()->with($import->errors === [] ? 'success' : 'warning', $message);
        }

        public function update(Request $request, KelompokKkn $kelompokKkn): RedirectResponse
        {
        Gate::authorize('manage-groups');

        $this->prepareMutationPayload($request);

        $validated = $request->validate([
            'period_id' => ['required', 'exists:periode,id'],
            'location_id' => ['required', 'exists:lokasi,id'],
            'dpl_period_id' => ['nullable', 'exists:dpl_periods,id'],
            'lecturers' => ['nullable', 'array'],
            'lecturers.*.id' => ['required', 'exists:dosen,id'],
            'lecturers.*.role' => ['required', 'in:Ketua,Anggota'],
            'name' => ['required', 'string', 'max:100'],
            'capacity' => ['required', 'integer', 'min:1', 'max:50'],
            'status' => ['required', 'in:draft,active,closed'],
        ]);

        // Proteksi: Validasi Kuota DPL & Peran Ketua
        if (isset($validated['lecturers'])) {
            $ketuaCount = 0;
            foreach ($validated['lecturers'] as $l) {
                if ($l['role'] === 'Ketua') $ketuaCount++;

                $dplPeriod = \App\Models\KKN\DplPeriod::where('dosen_id', $l['id'])
                    ->where('period_id', $validated['period_id'])
                    ->where('is_active', true)
                    ->first();

                if (!$dplPeriod) {
                    $dosen = \App\Models\KKN\Dosen::find($l['id']);
                    return back()->withErrors(['lecturers' => "Dosen {$dosen->nama} belum terdaftar/aktif di periode ini."])->withInput();
                }

                // Cek kuota, abaikan jika dosen tersebut memang sudah ada di kelompok ini (update)
                $isAlreadyInGroup = $kelompokKkn->dosen()->where('dosen_id', $l['id'])->exists();
                if (!$isAlreadyInGroup && !$dplPeriod->hasCapacity()) {
                    return back()->withErrors(['lecturers' => "Dosen {$dplPeriod->dosen->nama} sudah mencapai batas maksimal kelompok."])->withInput();
                }
            }

            if ($ketuaCount > 1) {
                return back()->withErrors(['lecturers' => 'Satu kelompok hanya boleh memiliki maksimal satu Ketua (DPL Utama).'])->withInput();
            }
        }

        $kelompokKkn->update([
            'period_id' => $validated['period_id'],
            'location_id' => $validated['location_id'],
            'nama_kelompok' => $validated['name'],
            'capacity' => $validated['capacity'],
            'status' => $validated['status'],
        ]);

        // Sync DPLs via Pivot Table & Sync Flat Columns
        if (isset($validated['lecturers'])) {
            $syncData = [];
            foreach ($validated['lecturers'] as $l) {
                $syncData[$l['id']] = ['role' => $l['role']];
            }
            $kelompokKkn->dosen()->sync($syncData);
            $kelompokKkn->syncKetuaFlatColumns();
        }

        return redirect()->route('admin.kelompok.index')->with('success', 'Kelompok berhasil diperbarui.');
        }
    public function destroy(KelompokKkn $kelompokKkn): RedirectResponse
    {
        Gate::authorize('manage-groups');

        // Prevent deletion if group has active participants
        if ($kelompokKkn->peserta()->whereIn('status', ['pending', 'approved', 'document_submitted'])->exists()) {
            return redirect()->route('admin.kelompok.index')->with('error', 'Kelompok masih memiliki peserta aktif. Pindahkan atau tolak semua peserta terlebih dahulu.');
        }

        $kelompokKkn->dosen()->detach(); // Clean up pivot
        $kelompokKkn->delete();

        return redirect()->route('admin.kelompok.index')->with('success', 'Kelompok berhasil dihapus.');
    }
}
