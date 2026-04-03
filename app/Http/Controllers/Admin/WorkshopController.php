<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\Workshop;
use App\Services\WorkshopService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkshopController extends Controller
{
    public function __construct(
        protected WorkshopService $workshopService
    ) {}

    public function index(): Response
    {
        return Inertia::render('Admin/Workshops/Index', [
            'workshops' => $this->workshopService->getUpcomingWorkshops(null, true, true),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'methodology' => ['nullable', 'string', 'max:100'],
            'workshop_date' => ['required', 'date'],
            'start_time' => ['nullable', 'string'],
            'end_time' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
            'max_participants' => ['nullable', 'integer', 'min:1'],
        ]);

        $this->workshopService->createWorkshop($validated);

        return redirect()->back()->with('success', 'Jadwal pembekalan berhasil ditambahkan.');
    }

    public function update(Request $request, Workshop $workshop): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'methodology' => ['nullable', 'string', 'max:100'],
            'workshop_date' => ['required', 'date'],
            'start_time' => ['nullable', 'string'],
            'end_time' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
            'max_participants' => ['nullable', 'integer', 'min:1'],
        ]);

        try {
            $this->workshopService->updateWorkshop($workshop, $validated);
            return redirect()->back()->with('success', 'Jadwal pembekalan berhasil diperbarui.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function markAttendance(Request $request, int $participantId): RedirectResponse
    {
        $this->workshopService->markAttendance($participantId, $request->input('attended', true));

        return redirect()->back()->with('success', 'Status kehadiran berhasil diperbarui.');
    }

    public function bulkAttendance(Request $request, int $workshopId): RedirectResponse
    {
        $validated = $request->validate([
            'attended_user_ids' => ['required', 'array'],
            'attended_user_ids.*' => ['exists:users,id'],
        ]);

        $this->workshopService->bulkMarkAttendance($workshopId, $validated['attended_user_ids']);

        return redirect()->back()->with('success', 'Presensi massal berhasil diproses.');
    }

    public function destroy(Workshop $workshop): RedirectResponse
    {
        try {
            $this->workshopService->cancelWorkshop($workshop);
            return redirect()->back()->with('success', 'Pembekalan berhasil dibatalkan.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
