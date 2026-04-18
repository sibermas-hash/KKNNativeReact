<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Imports\KelompokKknImport;
use App\Models\KKN\Dosen;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\JenisKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Periode;
use App\Traits\HandlesPagination;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
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

        $dplPeriodId = $request->input('dpl_periode_id');

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

        $query = KelompokKkn::with('periode', 'lokasi', 'dosen')
            ->withCount(['peserta', 'peserta as approved_participants_count' => function ($q) {
                $q->where('status', 'approved');
            }, 'peserta as pending_participants_count' => function ($q) {
                $q->where('status', 'pending');
            }])
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
            ->when($request->input('periode_id'), function ($query, $periodId) {
                $query->where('periode_id', $periodId);
            })
            ->when($request->input('jenis_kkn_id'), function ($query, $jenisId) {
                $query->whereHas('periode', function ($q) use ($jenisId) {
                    $q->where('jenis_kkn_id', $jenisId);
                });
            })
            ->when($request->input('status'), function ($query, $status) {
                $query->where('status', $status);
            });

        // Optimized Faculty Scoping for Groups:
        // Include groups where location belongs to the faculty OR has participants from the faculty
        $user = auth()->user();
        if ($user && $user->hasRole('faculty_admin') && $user->fakultas_id) {
            $query->where(function ($q) use ($user) {
                $q->whereHas('lokasi', fn ($loc) => $loc->where('fakultas_id', $user->fakultas_id))
                    ->orWhereHas('peserta.mahasiswa', fn ($mhs) => $mhs->where('fakultas_id', $user->fakultas_id));
            });
        }

        // Summary calculation from CLONED queries to avoid mutating the base query
        $summaryData = [
            'total' => (clone $query)->count(),
            'active' => (clone $query)->where('status', 'active')->count(),
            'draft' => (clone $query)->where('status', 'draft')->count(),
        ];

        $groups = $query->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        // Transform for frontend
        $groups->getCollection()->transform(function ($g) {
            $mainDpl = $g->dosen->where('pivot.role', 'Ketua')->first();
            $allDpls = $g->dosen->map(fn ($d) => [
                'id' => $d->id,
                'name' => $d->nama,
                'role' => $d->pivot->role,
            ])->values();
            $governance = $g->periode?->governance();
            $availableSlots = max((int) $g->capacity - (int) ($g->peserta_count ?? 0), 0);
            $readyForPlacement = (bool) (
                $g->status === 'active'
                && $g->periode?->usesAutomaticPlacementAfterApproval()
                && filled($g->lokasi?->regency_name)
                && $availableSlots > 0
            );

            return [
                'id' => $g->id,
                'code' => $g->code,
                'name' => $g->nama_kelompok,
                'capacity' => $g->capacity,
                'status' => $g->status,
                'registrations_count' => $g->peserta_count,
                'approved_participants_count' => (int) ($g->approved_participants_count ?? 0),
                'pending_participants_count' => (int) ($g->pending_participants_count ?? 0),
                'available_slots' => $availableSlots,
                'ready_for_placement' => $readyForPlacement,
                'placement_note' => $readyForPlacement
                    ? 'Siap menerima penempatan otomatis setelah admin menyetujui pendaftaran mahasiswa.'
                    : match (true) {
                        $g->status !== 'active' => 'Kelompok belum aktif sehingga belum dipakai untuk penempatan sistem.',
                        ! $g->periode?->usesAutomaticPlacementAfterApproval() => 'Periode ini tidak memakai auto-placement reguler.',
                        blank($g->lokasi?->regency_name) => 'Lokasi kelompok belum lengkap sampai tingkat kabupaten/kota.',
                        $availableSlots <= 0 => 'Kapasitas kelompok sudah penuh.',
                        default => 'Kelompok belum siap dipakai untuk auto-placement.',
                    },
                'period' => $g->periode ? ['id' => $g->periode->id, 'name' => $g->periode->name] : null,
                'governance' => $governance ? [
                    'program_type' => $governance['program_type'],
                    'program_type_label' => $governance['program_type_label'],
                    'registration_mode_label' => $governance['registration_mode_label'],
                    'placement_mode_label' => $governance['placement_mode_label'],
                ] : null,
                'location' => $g->lokasi ? [
                    'id' => $g->lokasi->id,
                    'village_name' => $g->lokasi->village_name,
                    'district_name' => $g->lokasi->district_name,
                    'regency_name' => $g->lokasi->regency_name,
                    'full_name' => $g->lokasi->full_name,
                ] : null,
                'main_lecturer' => $mainDpl ? ['id' => $mainDpl->id, 'name' => $mainDpl->nama] : null,
                'lecturers' => $allDpls,
            ];
        });

        $periods = Periode::where('is_active', true)->orderByDesc('start_date')->get()
            ->map(fn ($p) => ['id' => $p->id, 'name' => $p->name]);
        $locations = Lokasi::orderBy('village_name')->get()
            ->map(fn ($l) => [
                'id' => $l->id,
                'village_name' => $l->village_name,
                'full_name' => $l->full_name,
            ]);
        $lecturers = Dosen::orderBy('nama')->get()
            ->map(fn ($d) => ['id' => $d->id, 'name' => $d->nama]);
        $jenisKknOptions = JenisKkn::dropdownOptions();

        $groupCollection = collect($groups->items());

        return Inertia::render('Admin/Operational/Groups/Index', [
            'groups' => $this->formatPaginator($groups),
            'periods' => $periods,
            'jenisKknOptions' => $jenisKknOptions,
            'locations' => $locations,
            'lecturers' => $lecturers,
            'filters' => $request->only('search', 'periode_id', 'jenis_kkn_id', 'status'),
            'ui' => [
                'can_manage' => Gate::allows('manage-groups'),
            ],
            'workflow' => [
                'has_locations' => Lokasi::query()->exists(),
                'has_periods' => Periode::query()->exists(),
                'locations_managed_automatically' => true,
            ],
            'summary' => [
                'total_groups' => (int) ($summaryData['total'] ?? 0),
                'active_groups' => (int) ($summaryData['active'] ?? 0),
                'draft_groups' => (int) ($summaryData['draft'] ?? 0),
                'groups_without_main_lecturer' => $groupCollection->filter(fn (array $group) => blank($group['main_lecturer']))->count(),
                'groups_ready_for_placement' => $groupCollection->where('ready_for_placement', true)->count(),
                'total_available_slots' => $groupCollection->sum('available_slots'),
            ],
        ]);
    }

    public function show($id): Response
    {
        $kelompok = KelompokKkn::findOrFail($id);
        Gate::authorize('manage-groups');

        // Manual Faculty Scoping for detail view
        $user = auth()->user();
        if ($user && $user->hasRole('faculty_admin') && $user->fakultas_id) {
            $kelompok->load('lokasi');
            $hasParticipantFromFaculty = $kelompok->peserta()->whereHas('mahasiswa', fn ($q) => $q->where('fakultas_id', $user->fakultas_id))->exists();

            if ($kelompok->lokasi?->fakultas_id !== $user->fakultas_id && ! $hasParticipantFromFaculty) {
                abort(403, 'Anda tidak memiliki akses ke kelompok ini.');
            }
        }

        $kelompok->load([
            'periode',
            'lokasi',
            'dosen',
            'peserta.mahasiswa.fakultas',
            'peserta.mahasiswa.prodi',
            'programKerja',
            'posko',
        ]);

        return Inertia::render('Admin/Operational/Groups/Show', [
            'group' => $kelompok,
            'members' => $kelompok->peserta->values(),
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
            'periode_id' => ['required', 'exists:periode,id'],
            'location_id' => ['required', 'exists:lokasi,id'],
            'dpl_periode_id' => ['nullable', 'exists:dpl_periods,id'],
            'lecturers' => ['nullable', 'array'],
            'lecturers.*.id' => ['required', 'exists:dosen,id'],
            'lecturers.*.role' => ['required', 'in:Ketua,Anggota'],
            'name' => ['required', 'string', 'max:100'],
            'capacity' => ['required', 'integer', 'min:1', 'max:50'],
            'status' => ['required', 'in:draft,active,closed'],
        ]);

        // Proteksi: Validasi Kuota DPL & Peran Ketua
        if (! empty($validated['lecturers'])) {
            $ketuaCount = 0;
            foreach ($validated['lecturers'] as $l) {
                if ($l['role'] === 'Ketua') {
                    $ketuaCount++;
                }

                $dplPeriod = DplPeriod::where('dosen_id', $l['id'])
                    ->where('periode_id', $validated['periode_id'])
                    ->where('is_active', true)
                    ->first();

                if (! $dplPeriod) {
                    $dosen = Dosen::find($l['id']);

                    return back()->withErrors(['lecturers' => "Dosen {$dosen->nama} belum terdaftar/aktif di periode ini."])->withInput();
                }

                if (! $dplPeriod->hasCapacity()) {
                    return back()->withErrors(['lecturers' => "Dosen {$dplPeriod->dosen->nama} sudah mencapai batas maksimal kelompok."])->withInput();
                }
            }

            if ($ketuaCount > 1) {
                return back()->withErrors(['lecturers' => 'Satu kelompok hanya boleh memiliki maksimal satu Ketua (DPL Utama).'])->withInput();
            }
        }

        $group = KelompokKkn::create([
            'periode_id' => $validated['periode_id'],
            'location_id' => $validated['location_id'],
            'nama_kelompok' => $validated['name'],
            'capacity' => $validated['capacity'],
            'status' => $validated['status'],
            'code' => 'KKN-'.strtoupper(Str::random(6)),
            'token' => strtoupper(Str::random(8)),
        ]);

        // Sync DPLs via Pivot Table & Sync Flat Columns
        if (! empty($validated['lecturers'])) {
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

        $import = new KelompokKknImport;
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

    public function update(Request $request, $id): RedirectResponse
    {
        $kelompok = KelompokKkn::findOrFail($id);
        Gate::authorize('manage-groups');

        $this->prepareMutationPayload($request);

        $validated = $request->validate([
            'periode_id' => ['required', 'exists:periode,id'],
            'location_id' => ['required', 'exists:lokasi,id'],
            'dpl_periode_id' => ['nullable', 'exists:dpl_periods,id'],
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
                if ($l['role'] === 'Ketua') {
                    $ketuaCount++;
                }

                $dplPeriod = DplPeriod::where('dosen_id', $l['id'])
                    ->where('periode_id', $validated['periode_id'])
                    ->where('is_active', true)
                    ->first();

                if (! $dplPeriod) {
                    $dosen = Dosen::find($l['id']);

                    return back()->withErrors(['lecturers' => "Dosen {$dosen->nama} belum terdaftar/aktif di periode ini."])->withInput();
                }

                // Cek kuota, abaikan jika dosen tersebut memang sudah ada di kelompok ini (update)
                $isAlreadyInGroup = $kelompok->dosen()->where('dosen_id', $l['id'])->exists();
                if (! $isAlreadyInGroup && ! $dplPeriod->hasCapacity()) {
                    return back()->withErrors(['lecturers' => "Dosen {$dplPeriod->dosen->nama} sudah mencapai batas maksimal kelompok."])->withInput();
                }
            }

            if ($ketuaCount > 1) {
                return back()->withErrors(['lecturers' => 'Satu kelompok hanya boleh memiliki maksimal satu Ketua (DPL Utama).'])->withInput();
            }
        }

        $kelompok->update([
            'periode_id' => $validated['periode_id'],
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
            $kelompok->dosen()->sync($syncData);
            $kelompok->syncKetuaFlatColumns();
        }

        return redirect()->route('admin.kelompok.index')->with('success', 'Kelompok berhasil diperbarui.');
    }

    public function destroy($id): RedirectResponse
    {
        $kelompok = KelompokKkn::findOrFail($id);
        Gate::authorize('manage-groups');

        // Prevent deletion if group has active participants
        if ($kelompok->peserta()->whereIn('status', ['pending', 'approved', 'document_submitted'])->exists()) {
            return redirect()->route('admin.kelompok.index')->with('error', 'Kelompok masih memiliki peserta aktif. Pindahkan atau tolak semua peserta terlebih dahulu.');
        }

        $kelompok->delete();

        return redirect()->route('admin.kelompok.index')->with('success', 'Kelompok berhasil dihapus.');
    }
}
