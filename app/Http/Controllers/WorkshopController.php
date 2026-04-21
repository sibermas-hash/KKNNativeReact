<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\KKN\PesertaWorkshop;
use App\Models\KKN\Workshop;
use App\Services\DplEligibilityService;
use App\Services\PeriodContextService;
use App\Services\WorkshopService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class WorkshopController extends Controller
{
    protected $workshopService;

    protected $eligibilityService;

    public function __construct(WorkshopService $workshopService, DplEligibilityService $eligibilityService)
    {
        $this->workshopService = $workshopService;
        $this->eligibilityService = $eligibilityService;
    }

    /**
     * Display upcoming workshops
     */
    public function index(Request $request, PeriodContextService $periodContextService)
    {
        $user = $request->user();
        $activePeriodId = $periodContextService->getActivePeriodId() ?? $periodContextService->getDefaultPeriodId();

        $workshops = $this->workshopService->getUpcomingWorkshops(
            $user->hasRole('student') ? $user->id : null,
            $user->hasAnyRole(['superadmin', 'admin']),
            $user->hasAnyRole(['superadmin', 'admin']),
            $activePeriodId
        );

        // PRD FR-01: Eligibility for Lecturers
        $dplEligibility = null;
        if ($user->hasRole('dpl')) {
            $dosen = $user->dosen;
            if ($dosen) {
                $dplEligibility = $this->eligibilityService->canAttendWorkshop($dosen);
            }
        }

        return Inertia::render('Admin/Workshops/Index', [
            'workshops' => $workshops,
        ]);
    }

    /**
     * Store new workshop (Admin)
     */
    public function store(Request $request)
    {
        abort_unless($request->user()->hasAnyRole(['superadmin', 'admin']), 403, 'Hanya superadmin dan admin yang dapat membuat pembekalan.');

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
        abort_unless($request->user()->hasAnyRole(['superadmin', 'admin']), 403, 'Hanya superadmin dan admin yang dapat mengubah pembekalan.');

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
        abort_unless($request->user()->hasAnyRole(['superadmin', 'admin']), 403, 'Hanya superadmin dan admin yang dapat membatalkan pembekalan.');

        try {
            $this->workshopService->cancelWorkshop($workshop);
        } catch (\InvalidArgumentException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Pembekalan berhasil dibatalkan.');
    }

    /**
     * Update workshop passing status (Admin)
     */
    public function markPassingStatus(Request $request, int $workshop)
    {
        abort_unless($request->user()->hasAnyRole(['superadmin', 'admin']), 403, 'Hanya superadmin dan admin yang dapat mengelola status kelulusan pembekalan.');

        $validated = $request->validate([
            'user_ids' => ['nullable', 'array'],
            'user_ids.*' => ['integer'],
        ]);

        $this->workshopService->bulkMarkPassingStatus(
            $workshop,
            collect($validated['user_ids'] ?? [])->map(fn ($id) => (int) $id)->values()->all()
        );

        return back()->with('success', 'Status kelulusan pembekalan berhasil diperbarui.');
    }

    /**
     * Update workshop attendance (Admin)
     */
    public function markAttendance(Request $request, int $workshop)
    {
        abort_unless($request->user()->hasAnyRole(['superadmin', 'admin']), 403, 'Hanya superadmin dan admin yang dapat mengelola presensi pembekalan.');

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
     * Register for a workshop
     */
    public function register(Request $request, int $workshopId)
    {
        $user = $request->user();

        // PRD FR-01: Validation for Lecturers (DPL)
        if ($user->hasRole('dpl')) {
            $dosen = $user->dosen;
            if (! $dosen) {
                return back()->with('error', 'Profil dosen tidak ditemukan.');
            }

            $check = $this->eligibilityService->canAttendWorkshop($dosen);
            if (! $check['eligible']) {
                return back()->with('error', $check['reason']);
            }
        }

        try {
            $this->workshopService->registerParticipant(
                $workshopId,
                $user->id
            );

            return back()->with('success', 'Pendaftaran pembekalan berhasil.');
        } catch (\Exception $e) {
            Log::error('Workshop registration failed', ['error' => $e->getMessage()]);

            return back()->with('error', 'Pendaftaran pembekalan gagal: '.$e->getMessage());
        }
    }

    /**
     * Get user's workshop certificates
     */
    public function myCertificates(Request $request)
    {
        $user = $request->user();

        $certificates = PesertaWorkshop::where('user_id', $user->id)
            ->whereNotNull('certificate_issued_at')
            ->where('certificate_generated', true)
            ->with(['workshop:id,name,start_date,end_date'])
            ->orderByDesc('certificate_issued_at')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'workshop_name' => $p->workshop?->name,
                'workshop_start' => $p->workshop?->start_date?->format('d M Y'),
                'workshop_end' => $p->workshop?->end_date?->format('d M Y'),
                'certificate_issued_at' => $p->certificate_issued_at?->format('d M Y'),
                'certificate_url' => $p->certificate_path
                    ? route('student.workshops.certificate', $p->id)
                    : null,
            ]);

        return Inertia::render('Student/Workshops/Certificates', [
            'certificates' => $certificates,
        ]);
    }

    /**
     * Download workshop certificate
     */
    public function downloadCertificate(Request $request, PesertaWorkshop $participant)
    {
        $user = $request->user();

        if ($participant->user_id !== $user->id) {
            abort(403, 'Anda tidak memiliki akses ke sertifikat ini.');
        }

        if (! $participant->certificate_generated || ! $participant->certificate_path) {
            abort(404, 'Sertifikat belum tersedia.');
        }

        $filePath = storage_path('app/'.$participant->certificate_path);

        if (! file_exists($filePath)) {
            abort(404, 'File sertifikat tidak ditemukan.');
        }

        return response()->download($filePath,
            sprintf('sertifikat-workshop-%s.pdf', $participant->workshop?->slug ?? $participant->id)
        );
    }
}
