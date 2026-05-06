<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Workshop;
use App\Services\WorkshopService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkshopController extends Controller
{
    use ApiResponse;

    public function __construct(private WorkshopService $workshopService) {}

    public function index(Request $request): JsonResponse
    {
        $workshops = $this->workshopService->getUpcomingWorkshops(
            userId: null,
            includeParticipants: true,
            includeAllStatuses: true,
            periodId: $request->input('periode_id') ? (int) $request->input('periode_id') : null
        );

        return $this->success($workshops);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'periode_id'       => 'required|exists:periode,id',
            'title'            => 'required|string|max:255',
            'description'      => 'nullable|string',
            'workshop_date'    => 'required|date',
            'methodology'      => 'nullable|string',
            'start_time'       => 'nullable|date_format:H:i',
            'end_time'         => 'nullable|date_format:H:i|after:start_time',
            'location'         => 'nullable|string',
            'max_participants' => 'nullable|integer|min:1',
        ]);

        $workshop = $this->workshopService->createWorkshop($validated);

        return $this->success($workshop, 'Workshop berhasil dibuat.', 201);
    }

    public function update(Request $request, Workshop $workshop): JsonResponse
    {
        $validated = $request->validate([
            'title'            => 'required|string|max:255',
            'description'      => 'nullable|string',
            'workshop_date'    => 'required|date',
            'methodology'      => 'nullable|string',
            'start_time'       => 'nullable|date_format:H:i',
            'end_time'         => 'nullable|date_format:H:i|after:start_time',
            'location'         => 'nullable|string',
            'max_participants' => 'nullable|integer|min:1',
        ]);

        $this->workshopService->updateWorkshop($workshop, $validated);

        return $this->success($workshop->refresh(), 'Workshop berhasil diperbarui.');
    }

    public function cancel(Workshop $workshop): JsonResponse
    {
        $this->workshopService->cancelWorkshop($workshop);

        return $this->noContent('Workshop dibatalkan.');
    }

    public function markAttendance(Request $request, int $workshopId): JsonResponse
    {
        $validated = $request->validate([
            'user_ids'   => 'nullable|array',
            'user_ids.*' => 'integer',
        ]);

        $this->workshopService->bulkMarkAttendance(
            $workshopId,
            collect($validated['user_ids'] ?? [])->map(fn ($id) => (int) $id)->all()
        );

        return $this->noContent('Presensi berhasil diperbarui.');
    }

    public function exportParticipants(Workshop $workshop)
    {
        $participants = $workshop->peserta()
            ->with('user:id,name,email')
            ->get()
            ->map(fn ($p) => [
                'nama'                  => $p->user?->name,
                'email'                 => $p->user?->email,
                'attended'              => $p->attended ? 'Hadir' : 'Tidak Hadir',
                'is_passed'             => $p->is_passed ? 'Lulus' : 'Belum',
                'certificate_generated' => $p->certificate_generated ? 'Ya' : 'Tidak',
            ]);

        return $this->success($participants, 'Data peserta workshop.');
    }

    /**
     * Download template sertifikat workshop.
     */
    public function downloadCertificateTemplate(Workshop $workshop)
    {
        $templatePath = storage_path('app/templates/certificate_template.docx');

        if (! file_exists($templatePath)) {
            abort(404, 'Template sertifikat tidak ditemukan.');
        }

        return response()->download(
            $templatePath,
            "Template_Sertifikat_{$workshop->title}.docx",
            ['Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        );
    }
}
