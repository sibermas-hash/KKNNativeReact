<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Dosen;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Periode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class KelompokKknController extends Controller
{
    public function index(): Response
    {
        $groups = KelompokKkn::with('periode', 'lokasi', 'dosen') // Load 'dosen' (pivot) instead of 'dpl'
            ->withCount('peserta')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($g) {
            // Determine main DPL (Ketua)
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
            'groups' => $groups,
            'periods' => $periods,
            'locations' => $locations,
            'lecturers' => $lecturers,
        ]);
    }

    public function show(KelompokKkn $group): Response
    {
        $group->load([
            'periode',
            'lokasi',
            'dosen',
            'peserta.mahasiswa',
            'programKerja',
            'posko',
        ]);

        return Inertia::render('Admin/Groups/Show', [
            'group' => $group,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'period_id' => ['required', 'exists:periode,id'],
            'location_id' => ['required', 'exists:lokasi,id'],
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

        return redirect()->back()->with('success', 'Kelompok berhasil ditambahkan.');
        }

        public function update(Request $request, KelompokKkn $group): RedirectResponse
        {
        $validated = $request->validate([
            'period_id' => ['required', 'exists:periode,id'],
            'location_id' => ['required', 'exists:lokasi,id'],
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
                $isAlreadyInGroup = $group->dosen()->where('dosen_id', $l['id'])->exists();
                if (!$isAlreadyInGroup && !$dplPeriod->hasCapacity()) {
                    return back()->withErrors(['lecturers' => "Dosen {$dplPeriod->dosen->nama} sudah mencapai batas maksimal kelompok."])->withInput();
                }
            }

            if ($ketuaCount > 1) {
                return back()->withErrors(['lecturers' => 'Satu kelompok hanya boleh memiliki maksimal satu Ketua (DPL Utama).'])->withInput();
            }
        }

        $group->update([
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
            $group->dosen()->sync($syncData);
            $group->syncKetuaFlatColumns();
        }

        return redirect()->back()->with('success', 'Kelompok berhasil diperbarui.');
        }
    public function destroy(KelompokKkn $group): RedirectResponse
    {
        // Prevent deletion if group has active participants
        if ($group->peserta()->whereIn('status', ['pending', 'approved', 'document_submitted'])->exists()) {
            return redirect()->back()->withErrors(['error' => 'Kelompok masih memiliki peserta aktif. Pindahkan atau tolak semua peserta terlebih dahulu.']);
        }

        $group->dosen()->detach(); // Clean up pivot
        $group->delete();

        return redirect()->back()->with('success', 'Kelompok berhasil dihapus.');
    }
}
