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
    public function index(Request $request): Response
    {
        $periods = Periode::with('tahunAkademik')
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('angkatan', 'like', "%{$search}%")
                      ->orWhere('jenis', 'like', "%{$search}%");
            })
            ->orderByDesc('start_date')
            ->paginate(10)
            ->withQueryString();

        $periods->getCollection()->transform(fn ($p) => [
            'id' => $p->id,
            'angkatan' => $p->angkatan,
            'jenis' => $p->jenis,
            'name' => $p->name,
            'start_date' => $p->start_date?->format('Y-m-d'),
            'end_date' => $p->end_date?->format('Y-m-d'),
            'registration_start' => $p->registration_start?->format('Y-m-d'),
            'registration_end' => $p->registration_end?->format('Y-m-d'),
            'grading_start' => $p->grading_start?->format('Y-m-d'),
            'grading_end' => $p->grading_end?->format('Y-m-d'),
            'kuota' => $p->kuota,
            'is_active' => $p->is_active,
            'academic_year' => $p->tahunAkademik ? ['id' => $p->tahunAkademik->id, 'year' => $p->tahunAkademik->year] : null,
        ]);

        $academicYears = TahunAkademik::orderByDesc('year')->get()
            ->map(fn ($ay) => ['id' => $ay->id, 'year' => $ay->year]);

        return Inertia::render('Admin/Periods/Index', [
            'periods' => $periods,
            'academicYears' => $academicYears,
            'filters' => $request->only('search'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'academic_year_id' => ['required', 'exists:tahun_akademik,id'],
            'angkatan' => ['required', 'integer'],
            'jenis' => ['required', 'string', 'max:100'],
            'name' => ['required', 'string', 'max:100'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'registration_start' => ['required', 'date'],
            'registration_end' => ['required', 'date', 'after:registration_start'],
            'kuota' => ['required', 'integer', 'min:1'],
            'grading_start' => ['nullable', 'date'],
            'grading_end' => ['nullable', 'date', 'after_or_equal:grading_start'],
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
            'angkatan' => ['required', 'integer'],
            'jenis' => ['required', 'string', 'max:100'],
            'name' => ['required', 'string', 'max:100'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'registration_start' => ['required', 'date'],
            'registration_end' => ['required', 'date', 'after:registration_start'],
            'kuota' => ['required', 'integer', 'min:1'],
            'grading_start' => ['nullable', 'date'],
            'grading_end' => ['nullable', 'date', 'after_or_equal:grading_start'],
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

    public function duplicate(Periode $period): RedirectResponse
    {
        $newPeriod = $period->replicate();
        $newPeriod->name = $newPeriod->name . ' (Copy)';
        $newPeriod->is_active = false;
        $newPeriod->save();

        // Copy structural groups
        foreach ($period->kelompok as $group) {
            $newGroup = $group->replicate();
            $newGroup->period_id = $newPeriod->id;
            // Clear DPL and stats for new period
            $newGroup->dpl_id = null;
            $newGroup->save();
        }

        return redirect()->back()->with('success', 'Struktur periode dan kelompok berhasil diduplikasi.');
    }

    public function destroy(Periode $period): RedirectResponse
    {
        $period->delete();

        return redirect()->back()->with('success', 'Periode KKN berhasil dihapus.');
    }
}
