<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\PesertaWorkshop;
use App\Services\PeriodContextService;
use App\Services\WorkshopService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkshopController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly WorkshopService $workshopService
    ) {}

    public function index(Request $request, PeriodContextService $periodContext): JsonResponse
    {
        $periodeId = (int) ($request->input('periode_id') ?? $periodContext->getActivePeriodId() ?? 0);

        $workshops = $this->workshopService->getUpcomingWorkshops(
            userId: auth()->id(),
            periodId: $periodeId ?: null
        );

        return $this->success($workshops);
    }

    public function register(Request $request, int $workshopId): JsonResponse
    {
        $this->workshopService->registerParticipant($workshopId, auth()->id());

        return $this->noContent('Pendaftaran workshop berhasil.');
    }

    public function myCertificates(): JsonResponse
    {
        $certificates = PesertaWorkshop::where('user_id', auth()->id())
            ->whereNotNull('certificate_issued_at')
            ->where('certificate_generated', true)
            ->with('workshop:id,title,workshop_date')
            ->orderByDesc('certificate_issued_at')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'workshop_name' => $p->workshop?->title,
                'workshop_date' => $p->workshop?->workshop_date?->format('d M Y'),
                'certificate_issued_at' => $p->certificate_issued_at?->format('d M Y'),
            ]);

        return $this->success($certificates);
    }

    public function show(int $workshop): JsonResponse
    {
        return $this->error('Endpoint detail workshop belum tersedia.', 501);
    }

    public function attend(Request $request, int $workshop): JsonResponse
    {
        return $this->error('Endpoint absensi workshop belum tersedia.', 501);
    }

    public function downloadCertificate(PesertaWorkshop $participant)
    {
        abort_unless($participant->user_id === auth()->id(), 403, 'Anda tidak memiliki akses ke sertifikat ini.');
        abort_unless($participant->certificate_generated && $participant->certificate_path, 404, 'Sertifikat belum tersedia.');

        $filePath = storage_path('app/public/' . $participant->certificate_path);
        abort_unless(file_exists($filePath), 404, 'File sertifikat tidak ditemukan.');

        return response()->download($filePath, 'sertifikat-workshop-' . $participant->id . '.pdf');
    }
}
