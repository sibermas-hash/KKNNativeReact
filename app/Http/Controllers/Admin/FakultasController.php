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
    public function index(): Response
    {
        $fakultas = Fakultas::withCount('prodi')->orderBy('nama')->get();

        return Inertia::render('Admin/Faculties/Index', [
            'faculties' => $fakultas,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:10', 'unique:fakultas,code'],
            'nama' => ['required', 'string', 'max:100'],
        ]);

        Fakultas::create($validated);

        return redirect()->back()->with('success', 'Fakultas berhasil ditambahkan.');
    }

    public function update(Request $request, Fakultas $fakultas): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:10', 'unique:fakultas,code,' . $fakultas->id],
            'nama' => ['required', 'string', 'max:100'],
        ]);

        $fakultas->update($validated);

        return redirect()->back()->with('success', 'Fakultas berhasil diperbarui.');
    }

    public function destroy(Fakultas $fakultas): RedirectResponse
    {
        $fakultas->delete();

        return redirect()->back()->with('success', 'Fakultas berhasil dihapus.');
    }
}
