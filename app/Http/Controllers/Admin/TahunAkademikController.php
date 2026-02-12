<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\TahunAkademik;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TahunAkademikController extends Controller
{
    public function index(): Response
    {
        $academicYears = AcademicYear::orderByDesc('year')->get();

        return Inertia::render('Admin/AcademicYears/Index', [
            'academicYears' => $academicYears,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'year' => ['required', 'string', 'max:9', 'unique:academic_years,year'],
            'is_active' => ['boolean'],
        ]);

        if (!empty($validated['is_active'])) {
            AcademicYear::where('is_active', true)->update(['is_active' => false]);
            \Illuminate\Support\Facades\Cache::forget('active_year');
        }

        AcademicYear::create($validated);

        return redirect()->back()->with('success', 'Tahun akademik berhasil ditambahkan.');
    }

    public function update(Request $request, AcademicYear $academicYear): RedirectResponse
    {
        $validated = $request->validate([
            'year' => ['required', 'string', 'max:9', 'unique:academic_years,year,' . $academicYear->id],
            'is_active' => ['boolean'],
        ]);

        if (!empty($validated['is_active'])) {
            AcademicYear::where('id', '!=', $academicYear->id)
                ->where('is_active', true)
                ->update(['is_active' => false]);
            \Illuminate\Support\Facades\Cache::forget('active_year');
        }

        $academicYear->update($validated);

        return redirect()->back()->with('success', 'Tahun akademik berhasil diperbarui.');
    }

    public function destroy(AcademicYear $academicYear): RedirectResponse
    {
        $academicYear->delete();

        return redirect()->back()->with('success', 'Tahun akademik berhasil dihapus.');
    }
}
