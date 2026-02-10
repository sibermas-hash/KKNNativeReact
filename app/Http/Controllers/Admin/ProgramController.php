<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use App\Models\Program;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProgramController extends Controller
{
    public function index(): Response
    {
        $programs = Program::with('faculty')->orderBy('name')->get();
        $faculties = Faculty::orderBy('name')->get();

        return Inertia::render('Admin/Programs/Index', [
            'programs' => $programs,
            'faculties' => $faculties,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'faculty_id' => ['required', 'exists:faculties,id'],
            'code' => ['required', 'string', 'max:10', 'unique:programs,code'],
            'name' => ['required', 'string', 'max:100'],
        ]);

        Program::create($validated);

        return redirect()->back()->with('success', 'Program studi berhasil ditambahkan.');
    }

    public function update(Request $request, Program $program): RedirectResponse
    {
        $validated = $request->validate([
            'faculty_id' => ['required', 'exists:faculties,id'],
            'code' => ['required', 'string', 'max:10', 'unique:programs,code,' . $program->id],
            'name' => ['required', 'string', 'max:100'],
        ]);

        $program->update($validated);

        return redirect()->back()->with('success', 'Program studi berhasil diperbarui.');
    }

    public function destroy(Program $program): RedirectResponse
    {
        $program->delete();

        return redirect()->back()->with('success', 'Program studi berhasil dihapus.');
    }
}
