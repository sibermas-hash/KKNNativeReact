<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\KknRequirement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class KknRequirementController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/KknRequirements/Index', [
            'requirements' => KknRequirement::orderBy('id')->get(),
            // Provide a list of available columns in 'mahasiswa' table to pick from
            'availableColumns' => [
                ['value' => 'total_sks', 'label' => 'Total SKS'],
                ['value' => 'status_bta_ppi', 'label' => 'Status BTA PPI'],
                ['value' => 'semester', 'label' => 'Semester Aktif'],
                ['value' => 'gpa', 'label' => 'IPK (Grade Point Average)'],
                ['value' => 'batch_year', 'label' => 'Angkatan'],
                ['value' => 'gender', 'label' => 'Jenis Kelamin'],
            ],
            'operators' => [
                ['value' => '>=', 'label' => 'Minimal (>=)'],
                ['value' => '<=', 'label' => 'Maksimal (<=)'],
                ['value' => '==', 'label' => 'Harus Sama Dengan (==)'],
                ['value' => '!=', 'label' => 'Tidak Boleh Sama Dengan (!=)'],
                ['value' => 'in', 'label' => 'Termasuk dalam Daftar (in)'],
                ['value' => 'not_in', 'label' => 'Tidak Termasuk dalam Daftar (not_in)'],
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'column_name' => 'required|string',
            'operator' => 'required|string|in:>=,<=,>,<,==,!=,in,not_in',
            'expected_value' => 'required|string',
            'error_message' => 'required|string',
            'is_active' => 'boolean',
        ]);

        KknRequirement::create($validated);

        return back()->with('success', 'Syarat KKN baru berhasil ditambahkan.');
    }

    public function update(Request $request, KknRequirement $requirement): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'column_name' => 'required|string',
            'operator' => 'required|string|in:>=,<=,>,<,==,!=,in,not_in',
            'expected_value' => 'required|string',
            'error_message' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $requirement->update($validated);

        return back()->with('success', "Syarat '{$requirement->name}' berhasil diperbarui.");
    }

    public function toggle(KknRequirement $requirement): RedirectResponse
    {
        $requirement->is_active = !$requirement->is_active;
        $requirement->save();

        $status = $requirement->is_active ? 'diaktifkan' : 'dinonaktifkan';
        return back()->with('success', "Syarat '{$requirement->name}' berhasil {$status}.");
    }

    public function destroy(KknRequirement $requirement): RedirectResponse
    {
        $name = $requirement->name;
        $requirement->delete();

        return back()->with('success', "Syarat '{$name}' berhasil dihapus.");
    }
}
