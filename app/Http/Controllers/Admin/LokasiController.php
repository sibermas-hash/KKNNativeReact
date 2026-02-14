<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\Lokasi;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LokasiController extends Controller
{
    public function index(Request $request): Response
    {
        $locations = Lokasi::query()
            ->when($request->search, function ($query, $search) {
                $query->where('village_name', 'like', "%{$search}%")
                      ->orWhere('address', 'like', "%{$search}%");
            })
            ->orderBy('village_name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/Locations/Index', [
            'locations' => $locations,
            'filters' => $request->only('search'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'village_name' => ['required', 'string', 'max:100'],
            'address' => ['nullable', 'string'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'capacity' => ['required', 'integer', 'min:1'],
        ]);

        Lokasi::create($validated);

        return redirect()->back()->with('success', 'Lokasi berhasil ditambahkan.');
    }

    public function update(Request $request, Lokasi $location): RedirectResponse
    {
        $validated = $request->validate([
            'village_name' => ['required', 'string', 'max:100'],
            'address' => ['nullable', 'string'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'capacity' => ['required', 'integer', 'min:1'],
        ]);

        $location->update($validated);

        return redirect()->back()->with('success', 'Lokasi berhasil diperbarui.');
    }

    public function destroy(Lokasi $location): RedirectResponse
    {
        $location->delete();

        return redirect()->back()->with('success', 'Lokasi berhasil dihapus.');
    }
}
