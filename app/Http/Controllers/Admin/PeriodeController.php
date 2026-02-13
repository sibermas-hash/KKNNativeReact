<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\TahunAkademik;
use App\Models\KKN\Periode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PeriodeController extends Controller
{
    public function index(): Response
    {
        $periods = Periode::with('tahunAkademik')->orderByDesc('start_date')->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'start_date' => $p->start_date?->format('Y-m-d'),
                'end_date' => $p->end_date?->format('Y-m-d'),
                'registration_start' => $p->registration_start?->format('Y-m-d'),
                'registration_end' => $p->registration_end?->format('Y-m-d'),
                'is_active' => $p->is_active,
                'academic_year' => $p->tahunAkademik ? ['id' => $p->tahunAkademik->id, 'year' => $p->tahunAkademik->year] : null,
            ]);
        $academicYears = TahunAkademik::orderByDesc('year')->get()
            ->map(fn ($ay) => ['id' => $ay->id, 'year' => $ay->year]);

        return Inertia::render('Admin/Periods/Index', [
            'periods' => $periods,
            'academicYears' => $academicYears,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'academic_year_id' => ['required', 'exists:tahun_akademik,id'],
            'name' => ['required', 'string', 'max:100'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'registration_start' => ['required', 'date'],
            'registration_end' => ['required', 'date', 'after:registration_start'],
            'is_active' => ['boolean'],
        ]);

        if (!empty($validated['is_active'])) {
            Periode::where('is_active', true)->update(['is_active' => false]);
            \Illuminate\Support\Facades\Cache::forget('active_period');
        }

        Periode::create($validated);

        return redirect()->back()->with('success', 'Periode KKN berhasil ditambahkan.');
    }

    public function update(Request $request, Periode $period): RedirectResponse
    {
        $validated = $request->validate([
            'academic_year_id' => ['required', 'exists:tahun_akademik,id'],
            'name' => ['required', 'string', 'max:100'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'registration_start' => ['required', 'date'],
            'registration_end' => ['required', 'date', 'after:registration_start'],
            'is_active' => ['boolean'],
        ]);

        if (!empty($validated['is_active'])) {
            Periode::where('id', '!=', $period->id)
                ->where('is_active', true)
                ->update(['is_active' => false]);
            \Illuminate\Support\Facades\Cache::forget('active_period');
        }

        $period->update($validated);

        return redirect()->back()->with('success', 'Periode KKN berhasil diperbarui.');
    }

    public function destroy(Periode $period): RedirectResponse
    {
        $period->delete();

        return redirect()->back()->with('success', 'Periode KKN berhasil dihapus.');
    }
}
