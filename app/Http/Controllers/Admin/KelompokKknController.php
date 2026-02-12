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
        $groups = KelompokKkn::with('period', 'location', 'dpl')
            ->withCount('peserta')
            ->orderByDesc('created_at')
            ->get();

        $periods = Periode::where('is_active', true)->orderByDesc('start_date')->get();
        $locations = Lokasi::orderBy('village_name')->get();
        $lecturers = Dosen::orderBy('nama')->get();

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
            'period',
            'location',
            'dpl',
            'registrations.mahasiswa',
            'workPrograms',
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
            'dpl_id' => ['nullable', 'exists:dosen,id'],
            'nama_kelompok' => ['required', 'string', 'max:100'],
            'capacity' => ['required', 'integer', 'min:1', 'max:50'],
            'status' => ['required', 'in:draft,active,closed'],
        ]);

        $validated['code'] = 'KKN-' . strtoupper(Str::random(6));
        $validated['token'] = strtoupper(Str::random(8));

        KelompokKkn::create($validated);

        return redirect()->back()->with('success', 'Kelompok berhasil ditambahkan.');
    }

    public function update(Request $request, KelompokKkn $group): RedirectResponse
    {
        $validated = $request->validate([
            'period_id' => ['required', 'exists:periode,id'],
            'location_id' => ['required', 'exists:lokasi,id'],
            'dpl_id' => ['nullable', 'exists:dosen,id'],
            'nama_kelompok' => ['required', 'string', 'max:100'],
            'capacity' => ['required', 'integer', 'min:1', 'max:50'],
            'status' => ['required', 'in:draft,active,closed'],
        ]);

        $group->update($validated);

        return redirect()->back()->with('success', 'Kelompok berhasil diperbarui.');
    }

    public function destroy(KelompokKkn $group): RedirectResponse
    {
        $group->delete();

        return redirect()->back()->with('success', 'Kelompok berhasil dihapus.');
    }
}
