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
        $groups = KelompokKkn::with('periode', 'lokasi', 'dpl')
            ->withCount('peserta')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($g) => [
                'id' => $g->id,
                'code' => $g->code,
                'name' => $g->nama_kelompok,
                'capacity' => $g->capacity,
                'status' => $g->status,
                'registrations_count' => $g->peserta_count,
                'period' => $g->periode ? ['id' => $g->periode->id, 'name' => $g->periode->name] : null,
                'location' => $g->lokasi ? ['id' => $g->lokasi->id, 'village_name' => $g->lokasi->village_name] : null,
                'lecturer' => $g->dpl ? ['id' => $g->dpl->id, 'name' => $g->dpl->nama] : null,
            ]);

        $periods = Periode::where('is_active', true)->orderByDesc('start_date')->get()
            ->map(fn ($p) => ['id' => $p->id, 'name' => $p->name]);
        $locations = Lokasi::orderBy('village_name')->get()
            ->map(fn ($l) => ['id' => $l->id, 'village_name' => $l->village_name]);
        $lecturers = Dosen::orderBy('nama')->get()
            ->map(fn ($d) => ['id' => $d->id, 'name' => $d->nama]);

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
            'dpl',
            'peserta.mahasiswa',
            'programKerja',
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
            'lecturer_id' => ['nullable', 'exists:dosen,id'],
            'name' => ['required', 'string', 'max:100'],
            'capacity' => ['required', 'integer', 'min:1', 'max:50'],
            'status' => ['required', 'in:draft,active,closed'],
        ]);

        KelompokKkn::create([
            'period_id' => $validated['period_id'],
            'location_id' => $validated['location_id'],
            'dpl_id' => $validated['lecturer_id'] ?? null,
            'nama_kelompok' => $validated['name'],
            'capacity' => $validated['capacity'],
            'status' => $validated['status'],
            'code' => 'KKN-' . strtoupper(Str::random(6)),
            'token' => strtoupper(Str::random(8)),
        ]);

        return redirect()->back()->with('success', 'Kelompok berhasil ditambahkan.');
    }

    public function update(Request $request, KelompokKkn $group): RedirectResponse
    {
        $validated = $request->validate([
            'period_id' => ['required', 'exists:periode,id'],
            'location_id' => ['required', 'exists:lokasi,id'],
            'lecturer_id' => ['nullable', 'exists:dosen,id'],
            'name' => ['required', 'string', 'max:100'],
            'capacity' => ['required', 'integer', 'min:1', 'max:50'],
            'status' => ['required', 'in:draft,active,closed'],
        ]);

        $group->update([
            'period_id' => $validated['period_id'],
            'location_id' => $validated['location_id'],
            'dpl_id' => $validated['lecturer_id'] ?? null,
            'nama_kelompok' => $validated['name'],
            'capacity' => $validated['capacity'],
            'status' => $validated['status'],
        ]);

        return redirect()->back()->with('success', 'Kelompok berhasil diperbarui.');
    }

    public function destroy(KelompokKkn $group): RedirectResponse
    {
        $group->delete();

        return redirect()->back()->with('success', 'Kelompok berhasil dihapus.');
    }
}
