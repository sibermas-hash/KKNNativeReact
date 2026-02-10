<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\Lecturer;
use App\Models\Location;
use App\Models\Period;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class GroupController extends Controller
{
    public function index(): Response
    {
        $groups = Group::with('period', 'location', 'lecturer')
            ->withCount('registrations')
            ->orderByDesc('created_at')
            ->get();

        $periods = Period::where('is_active', true)->orderByDesc('start_date')->get();
        $locations = Location::orderBy('village_name')->get();
        $lecturers = Lecturer::orderBy('name')->get();

        return Inertia::render('Admin/Groups/Index', [
            'groups' => $groups,
            'periods' => $periods,
            'locations' => $locations,
            'lecturers' => $lecturers,
        ]);
    }

    public function show(Group $group): Response
    {
        $group->load([
            'period',
            'location',
            'lecturer',
            'registrations.student',
            'workPrograms',
        ]);

        return Inertia::render('Admin/Groups/Show', [
            'group' => $group,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'period_id' => ['required', 'exists:periods,id'],
            'location_id' => ['required', 'exists:locations,id'],
            'lecturer_id' => ['nullable', 'exists:lecturers,id'],
            'name' => ['required', 'string', 'max:100'],
            'capacity' => ['required', 'integer', 'min:1', 'max:50'],
            'status' => ['required', 'in:draft,active,closed'],
        ]);

        $validated['code'] = 'KKN-' . strtoupper(Str::random(6));
        $validated['token'] = strtoupper(Str::random(8));

        Group::create($validated);

        return redirect()->back()->with('success', 'Kelompok berhasil ditambahkan.');
    }

    public function update(Request $request, Group $group): RedirectResponse
    {
        $validated = $request->validate([
            'period_id' => ['required', 'exists:periods,id'],
            'location_id' => ['required', 'exists:locations,id'],
            'lecturer_id' => ['nullable', 'exists:lecturers,id'],
            'name' => ['required', 'string', 'max:100'],
            'capacity' => ['required', 'integer', 'min:1', 'max:50'],
            'status' => ['required', 'in:draft,active,closed'],
        ]);

        $group->update($validated);

        return redirect()->back()->with('success', 'Kelompok berhasil diperbarui.');
    }

    public function destroy(Group $group): RedirectResponse
    {
        $group->delete();

        return redirect()->back()->with('success', 'Kelompok berhasil dihapus.');
    }
}
