<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\Fakultas;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FakultasController extends Controller
{
    public function index(Request $request): Response
    {
        $faculties = Fakultas::query()
            ->when($request->search, function ($query, $search) {
                $s = str_replace(['%', '_'], ['\\%', '\\_'], $search);
                $query->where('nama', 'like', "%{$s}%")
                      ->orWhere('code', 'like', "%{$s}%");
            })
            ->withCount('prodi')
            ->orderBy('nama')
            ->paginate(10)
            ->withQueryString();

        $faculties->getCollection()->transform(fn ($f) => [
            'id' => $f->id,
            'code' => $f->code,
            'name' => $f->nama, // Map nama to name
            'programs_count' => $f->prodi_count,
        ]);

        return Inertia::render('Admin/Faculties/Index', [
            'faculties' => $faculties,
            'filters' => $request->only('search'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:10', 'unique:fakultas,code'],
            'name' => ['required', 'string', 'max:100'],
        ]);

        Fakultas::create([
            'code' => $validated['code'],
            'nama' => $validated['name'],
        ]);

        return redirect()->back()->with('success', 'Fakultas berhasil ditambahkan.');
    }

    public function update(Request $request, Fakultas $fakultas): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:10', 'unique:fakultas,code,' . $fakultas->id],
            'name' => ['required', 'string', 'max:100'],
        ]);

        $fakultas->update([
            'code' => $validated['code'],
            'nama' => $validated['name'],
        ]);

        return redirect()->back()->with('success', 'Fakultas berhasil diperbarui.');
    }

    public function destroy(Fakultas $fakultas): RedirectResponse
    {
        $fakultas->delete();

        return redirect()->back()->with('success', 'Fakultas berhasil dihapus.');
    }
}
