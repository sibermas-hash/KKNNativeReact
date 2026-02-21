<?php

namespace App\Http\Controllers;

use App\Services\WorkshopService;
use Illuminate\Http\Request;
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
    public function index(Request $request)
    {
        $workshops = $this->workshopService->getUpcomingWorkshops();

        if ($request->user()->hasRole('admin') || $request->user()->hasRole('superadmin')) {
            return Inertia::render('Admin/Workshops/Index', [
                'workshops' => $workshops,
            ]);
        }

        return Inertia::render('Student/Workshops/Index', [
            'workshops' => $workshops,
        ]);
    }

    /**
     * Store new workshop (Admin)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'workshop_date' => 'required|date',
            'methodology' => 'nullable|string',
            'location' => 'nullable|string',
        ]);

        $this->workshopService->createWorkshop($validated);

        return back()->with('success', 'Workshop berhasil dibuat.');
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
            return back()->with('success', 'Pendaftaran workshop berhasil.');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Workshop registration failed', ['error' => $e->getMessage()]);
            return back()->with('error', 'Pendaftaran workshop gagal. Silakan coba lagi.');
        }
    }
}
