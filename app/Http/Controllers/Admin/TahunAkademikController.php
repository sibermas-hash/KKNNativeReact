<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\TahunAkademik;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TahunAkademikController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('manage-master-data');
        $academicYears = TahunAkademik::query()
            ->when($request->search, function ($query, $search) {
                $s = str_replace(['%', '_'], ['\\%', '\\_'], $search);
                $query->where('year', 'like', "%{$s}%");
            })
            ->orderByDesc('year')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/MasterData/AcademicYears/Index', [
            'academicYears' => $academicYears,
            'filters' => $request->only('search'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('manage-master-data');

        $validated = $request->validate([
            'year' => ['required', 'string', 'max:9', 'unique:tahun_akademik,year'],
            'is_active' => ['boolean'],
        ]);

        TahunAkademik::create($validated);

        return redirect()->back()->with('success', 'Tahun akademik berhasil ditambahkan.');
    }

    public function update(Request $request, TahunAkademik $tahunAkademik): RedirectResponse
    {
        Gate::authorize('manage-master-data');

        $validated = $request->validate([
            'year' => ['required', 'string', 'max:9', 'unique:tahun_akademik,year,' . $tahunAkademik->id],
            'is_active' => ['boolean'],
        ]);

        // Proteksi: Mencegah menonaktifkan satu-satunya tahun aktif
        if ($tahunAkademik->is_active && empty($validated['is_active'])) {
            $activeCount = TahunAkademik::where('is_active', true)->count();
            if ($activeCount <= 1) {
                return redirect()->back()->withErrors(['is_active' => 'Gagal menonaktifkan. Sistem memerlukan minimal satu tahun akademik yang aktif.']);
            }
        }

        $tahunAkademik->update($validated);

        return redirect()->back()->with('success', 'Tahun akademik berhasil diperbarui.');
    }

    public function destroy(TahunAkademik $tahunAkademik): RedirectResponse
    {
        Gate::authorize('manage-master-data');

        // Proteksi 1: Cek relasi ke periode
        if ($tahunAkademik->periode()->exists()) {
            return redirect()->back()->withErrors(['error' => 'Gagal menghapus. Tahun akademik ini sudah memiliki data Periode KKN terkait.']);
        }

        // Proteksi 2: Cek jika tahun yang dihapus adalah yang aktif
        if ($tahunAkademik->is_active) {
            return redirect()->back()->withErrors(['error' => 'Gagal menghapus. Tahun akademik yang sedang aktif tidak boleh dihapus.']);
        }

        $tahunAkademik->delete();

        return redirect()->back()->with('success', 'Tahun akademik berhasil dihapus.');
    }
}

