<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Dosen;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\PesertaWorkshop;
use App\Services\DplEligibilityService;
use App\Services\PeriodContextService;
use App\Services\WorkshopService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;

class WorkshopController extends Controller
{
    use ApiResponse;

    public function __construct(
        private WorkshopService $workshopService,
        private DplEligibilityService $eligibilityService,
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
        $dosen = auth()->user()?->dosen;

        if (! $dosen) {
            return $this->error('FORBIDDEN', 'Profil dosen tidak ditemukan.', 422);
        }

        $check = $this->eligibilityService->canAttendWorkshop($dosen);
        if (! $check['eligible']) {
            return $this->error('FORBIDDEN', $check['reason'], 422);
        }

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
                'participant_id' => $p->id,
                'title' => $p->workshop?->title,
                'workshop_name' => $p->workshop?->title,
                'workshop_date' => $p->workshop?->workshop_date?->format('d M Y'),
                'is_passed' => true,
                'certificate_issued_at' => $p->certificate_issued_at?->format('d M Y'),
                'certificate_path' => $p->certificate_path,
                'download_url' => URL::temporarySignedRoute(
                    'api.v1.dosen.workshops.certificate.download',
                    now()->addHours(2),
                    ['participant' => $p->id],
                ),
            ]);

        return $this->success($certificates);
    }

    public function downloadCertificate(PesertaWorkshop $participant)
    {
        if ($participant->user_id !== auth()->id()) {
            abort(403, 'Anda tidak memiliki akses ke sertifikat ini.');
        }

        if (! $participant->certificate_generated || ! $participant->certificate_path) {
            abort(404, 'Sertifikat belum tersedia.');
        }

        // X-002 fix (audit): read from PRIVATE disk, not public.
        $filePath = storage_path('app/private/'.$participant->certificate_path);

        if (! file_exists($filePath)) {
            abort(404, 'File sertifikat tidak ditemukan.');
        }

        return response()->download(
            $filePath,
            'sertifikat-workshop-'.$participant->id.'.pdf'
        );
    }
}
