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
    public function index(Request $request): Response
    {
        $academicYears = TahunAkademik::query()
            ->when($request->search, function ($query, $search) {
                $s = str_replace(['%', '_'], ['\\%', '\\_'], $search);
                $query->where('year', 'like', "%{$s}%");
            })
            ->orderByDesc('year')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/AcademicYears/Index', [
            'academicYears' => $academicYears,
            'filters' => $request->only('search'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'year' => ['required', 'string', 'max:9', 'unique:tahun_akademik,year'],
            'is_active' => ['boolean'],
        ]);

        if (!empty($validated['is_active'])) {
            TahunAkademik::where('is_active', true)->update(['is_active' => false]);
            \Illuminate\Support\Facades\Cache::forget('active_year');
        }

        TahunAkademik::create($validated);

        return redirect()->back()->with('success', 'Tahun akademik berhasil ditambahkan.');
    }

    public function update(Request $request, TahunAkademik $tahunAkademik): RedirectResponse
    {
        $validated = $request->validate([
            'year' => ['required', 'string', 'max:9', 'unique:tahun_akademik,year,' . $tahunAkademik->id],
            'is_active' => ['boolean'],
        ]);

        if (!empty($validated['is_active'])) {
            TahunAkademik::where('id', '!=', $tahunAkademik->id)
                ->where('is_active', true)
                ->update(['is_active' => false]);
            \Illuminate\Support\Facades\Cache::forget('active_year');
        }

        $tahunAkademik->update($validated);

        return redirect()->back()->with('success', 'Tahun akademik berhasil diperbarui.');
    }

    public function destroy(TahunAkademik $tahunAkademik): RedirectResponse
    {
        $tahunAkademik->delete();

        return redirect()->back()->with('success', 'Tahun akademik berhasil dihapus.');
    }
}

