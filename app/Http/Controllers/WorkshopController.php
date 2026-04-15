<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\KKN\Workshop;
use App\Services\PeriodContextService;
use App\Services\WorkshopService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class WorkshopController extends Controller
{
    protected $workshopService;

    public function __construct(WorkshopService $workshopService)
    {
        $this->workshopService = $workshopService;
    }

    /**
     * Display upcoming workshops
     */
    public function index(Request $request, PeriodContextService $periodContextService)
    {
        $activePeriodId = $periodContextService->getActivePeriodId() ?? $periodContextService->getDefaultPeriodId();
        $workshops = $this->workshopService->getUpcomingWorkshops(
            $request->user()->hasRole('student') ? $request->user()->id : null,
            $request->user()->hasRole('superadmin'),
            $request->user()->hasRole('superadmin'),
            $activePeriodId
        );

        if ($request->user()->hasRole('superadmin')) {
            return Inertia::render('Admin/Workshops/Index', [
                'workshops' => $workshops,
            ]);
        }

        return Inertia::render('Student/Workshops/Index', [
            'workshops' => $workshops,
            'workflow' => [
                'period_scoped' => Workshop::supportsPeriodAssignment(),
            ],
        ]);
    }

    /**
     * Store new workshop (Admin)
     */
    public function store(Request $request)
    {
        abort_unless($request->user()->hasRole('superadmin'), 403, 'Hanya superadmin yang dapat membuat pembekalan.');

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'workshop_date' => 'required|date',
            'methodology' => 'nullable|string',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i|after:start_time',
            'location' => 'nullable|string',
            'max_participants' => 'nullable|integer|min:1',
        ]);

        $this->workshopService->createWorkshop($validated);

        return back()->with('success', 'Pembekalan berhasil dibuat.');
    }

    /**
     * Update workshop details (Admin)
     */
    public function update(Request $request, Workshop $workshop)
    {
        abort_unless($request->user()->hasRole('superadmin'), 403, 'Hanya superadmin yang dapat mengubah pembekalan.');

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'workshop_date' => 'required|date',
            'methodology' => 'nullable|string',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i|after:start_time',
            'location' => 'nullable|string',
            'max_participants' => 'nullable|integer|min:1',
        ]);

        try {
            $this->workshopService->updateWorkshop($workshop, $validated);
        } catch (\InvalidArgumentException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Pembekalan berhasil diperbarui.');
    }

    /**
     * Cancel workshop (Admin)
     */
    public function cancel(Request $request, Workshop $workshop)
    {
        abort_unless($request->user()->hasRole('superadmin'), 403, 'Hanya superadmin yang dapat membatalkan pembekalan.');

        try {
            $this->workshopService->cancelWorkshop($workshop);
        } catch (\InvalidArgumentException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Pembekalan berhasil dibatalkan.');
    }

    /**
     * Update workshop attendance (Admin)
     */
    public function markAttendance(Request $request, int $workshop)
    {
        abort_unless($request->user()->hasRole('superadmin'), 403, 'Hanya superadmin yang dapat mengelola presensi pembekalan.');

        $validated = $request->validate([
            'user_ids' => ['nullable', 'array'],
            'user_ids.*' => ['integer'],
        ]);

        $this->workshopService->bulkMarkAttendance(
            $workshop,
            collect($validated['user_ids'] ?? [])->map(fn ($id) => (int) $id)->values()->all()
        );

        return back()->with('success', 'Presensi pembekalan berhasil diperbarui.');
    }

    /**
     * Register for a workshop (Student)
     */
    public function register(Request $request, int $workshopId)
    {
        try {
            $this->workshopService->registerParticipant(
                $workshopId,
                $request->user()->id
            );

            return back()->with('success', 'Pendaftaran pembekalan berhasil.');
        } catch (\Exception $e) {
            Log::error('Workshop registration failed', ['error' => $e->getMessage()]);

            return back()->with('error', 'Pendaftaran pembekalan gagal. Silakan coba lagi.');
        }
    }
}
