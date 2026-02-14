<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\Fakultas;
use App\Models\KKN\Prodi;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProdiController extends Controller
{
    public function index(Request $request): Response
    {
        $programs = Prodi::with('fakultas')
            ->when($request->search, function ($query, $search) {
                $query->where('nama', 'like', "%{$search}%")
                      ->orWhere('code', 'like', "%{$search}%")
                      ->orWhereHas('fakultas', function ($q) use ($search) {
                          $q->where('nama', 'like', "%{$search}%");
                      });
            })
            ->orderBy('nama')
            ->paginate(10)
            ->withQueryString();

        $programs->getCollection()->transform(fn ($p) => [
            'id' => $p->id,
            'code' => $p->code,
            'name' => $p->nama, // Map nama to name
            'faculty' => $p->fakultas ? ['id' => $p->fakultas->id, 'name' => $p->fakultas->nama] : null,
        ]);

        $faculties = Fakultas::orderBy('nama')->get()
            ->map(fn ($f) => ['id' => $f->id, 'name' => $f->nama]);

        return Inertia::render('Admin/Programs/Index', [
            'programs' => $programs,
            'faculties' => $faculties,
            'filters' => $request->only('search'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'faculty_id' => ['required', 'exists:fakultas,id'],
            'code' => ['required', 'string', 'max:10', 'unique:prodi,code'],
            'name' => ['required', 'string', 'max:100'],
        ]);

        Prodi::create([
            'faculty_id' => $validated['faculty_id'],
            'code' => $validated['code'],
            'nama' => $validated['name'],
        ]);

        return redirect()->back()->with('success', 'Program studi berhasil ditambahkan.');
    }

    public function update(Request $request, Prodi $program): RedirectResponse
    {
        $validated = $request->validate([
            'faculty_id' => ['required', 'exists:fakultas,id'],
            'code' => ['required', 'string', 'max:10', 'unique:prodi,code,' . $program->id],
            'name' => ['required', 'string', 'max:100'],
        ]);

        $program->update([
            'faculty_id' => $validated['faculty_id'],
            'code' => $validated['code'],
            'nama' => $validated['name'],
        ]);

        return redirect()->back()->with('success', 'Program studi berhasil diperbarui.');
    }

    public function destroy(Prodi $program): RedirectResponse
    {
        $program->delete();

        return redirect()->back()->with('success', 'Program studi berhasil dihapus.');
    }
}
