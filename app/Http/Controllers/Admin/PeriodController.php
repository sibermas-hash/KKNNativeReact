<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Period;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PeriodController extends Controller
{
    public function index(): Response
    {
        $periods = Period::with('academicYear')->orderByDesc('start_date')->get();
        $academicYears = AcademicYear::orderByDesc('year')->get();

        return Inertia::render('Admin/Periods/Index', [
            'periods' => $periods,
            'academicYears' => $academicYears,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'academic_year_id' => ['required', 'exists:academic_years,id'],
            'name' => ['required', 'string', 'max:100'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'registration_start' => ['required', 'date'],
            'registration_end' => ['required', 'date', 'after:registration_start'],
            'is_active' => ['boolean'],
        ]);

        if (!empty($validated['is_active'])) {
            Period::where('is_active', true)->update(['is_active' => false]);
            \Illuminate\Support\Facades\Cache::forget('active_period');
        }

        Period::create($validated);

        return redirect()->back()->with('success', 'Periode KKN berhasil ditambahkan.');
    }

    public function update(Request $request, Period $period): RedirectResponse
    {
        $validated = $request->validate([
            'academic_year_id' => ['required', 'exists:academic_years,id'],
            'name' => ['required', 'string', 'max:100'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'registration_start' => ['required', 'date'],
            'registration_end' => ['required', 'date', 'after:registration_start'],
            'is_active' => ['boolean'],
        ]);

        if (!empty($validated['is_active'])) {
            Period::where('id', '!=', $period->id)
                ->where('is_active', true)
                ->update(['is_active' => false]);
            \Illuminate\Support\Facades\Cache::forget('active_period');
        }

        $period->update($validated);

        return redirect()->back()->with('success', 'Periode KKN berhasil diperbarui.');
    }

    public function destroy(Period $period): RedirectResponse
    {
        $period->delete();

        return redirect()->back()->with('success', 'Periode KKN berhasil dihapus.');
    }
}
