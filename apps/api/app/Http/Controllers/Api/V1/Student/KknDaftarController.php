<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\SystemSetting;
use App\Services\EligibilityService;
use App\Services\KKN\RegistrationDocumentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KknDaftarController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly EligibilityService $eligibilityService,
        private readonly RegistrationDocumentService $documentService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $mahasiswa = $user?->mahasiswa;

        // Cek apakah mahasiswa sudah pernah mendaftar/mengikuti KKN
        $existingRegistration = null;
        $hasRegistered = false;
        if ($mahasiswa) {
            $existingRegistration = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
                ->whereNotIn('status', ['rejected', 'cancelled'])
                ->with('periode.jenisKkn')
                ->first();
            $hasRegistered = (bool) $existingRegistration;
        }

        $periods = Periode::where('is_active', true)
            ->whereIn('current_phase', ['registration', 'placement', 'execution'])
            ->with(['jenisKkn', 'tahunAkademik'])
            ->orderByDesc('registration_start')
            ->get()
            ->map(function ($p) use ($mahasiswa, $hasRegistered) {
                $canRegister = in_array($p->current_phase, ['registration', 'placement']);
                $eligibility = $this->checkEligibility($mahasiswa, $p);
                $documentRequirements = $this->documentService->requirementsForPeriod($p);

                if ($hasRegistered) {
                    $canRegister = false;
                }

                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'jenis' => [
                        'id' => $p->jenisKkn?->id,
                        'name' => $p->jenisKkn?->name,
                        'code' => $p->jenisKkn?->code,
                        'description' => $p->jenisKkn?->description,
                    ],
                    'requirements' => [
                        'config' => $p->jenisKkn?->requirements_config ?? [],
                        'documents' => collect($documentRequirements)->pluck('label')->values()->all(),
                    ],
                    'registration_start' => $p->registration_start?->format('d/m/Y'),
                    'registration_end' => $p->registration_end?->format('d/m/Y'),
                    'start_date' => $p->start_date?->format('d/m/Y'),
                    'end_date' => $p->end_date?->format('d/m/Y'),
                    'kuota' => $p->kuota,
                    'current_phase' => $p->current_phase,
                    'can_register' => $canRegister && $eligibility['is_eligible'],
                    'ineligible_reasons' => $hasRegistered ? [] : $eligibility['reasons'],
                ];
            });

        return $this->success([
            'periods' => $periods,
            'user_eligibility' => $this->getUserEligibility($mahasiswa),
            'registration_status' => $existingRegistration ? [
                'has_registered' => true,
                'status' => $existingRegistration->status,
                'period_name' => $existingRegistration->periode?->name ?? '-',
                'jenis_name' => $existingRegistration->periode?->jenisKkn?->name ?? '-',
                'registered_at' => $existingRegistration->created_at?->format('d/m/Y'),
            ] : ['has_registered' => false],
        ]);
    }

    /**
     * GET /api/v1/student/kkn-daftar/{periode}/kelompok
     * Returns available groups for a period with capacity and gender composition.
     */
    public function groups(Request $request, int $periode): JsonResponse
    {
        $periodeModel = Periode::where('id', $periode)
            ->where('is_active', true)
            ->first();

        if (! $periodeModel) {
            return $this->error('Periode tidak ditemukan', 404);
        }

        $activeStatuses = ['pending', 'document_submitted', 'approved'];

        $groups = KelompokKkn::where('periode_id', $periode)
            ->where('status', 'active')
            ->with('lokasi')
            ->withCount(['peserta as peserta_count' => function ($q) use ($activeStatuses) {
                $q->whereIn('status', $activeStatuses);
            }])
            ->withCount(['peserta as male_count' => function ($q) use ($activeStatuses) {
                $q->whereIn('status', $activeStatuses)
                    ->whereHas('mahasiswa', fn ($mq) => $mq->where('gender', 'L'));
            }])
            ->withCount(['peserta as female_count' => function ($q) use ($activeStatuses) {
                $q->whereIn('status', $activeStatuses)
                    ->whereHas('mahasiswa', fn ($mq) => $mq->where('gender', 'P'));
            }])
            ->orderBy('nama_kelompok')
            ->get()
            ->map(function ($group) {
                $remaining = max(0, $group->capacity - $group->peserta_count);
                $maleMinRequired = (int) ceil($group->capacity * 0.2);
                $maleTargetMax = (int) ceil($group->capacity * 0.3);

                return [
                    'id' => $group->id,
                    'nama_kelompok' => $group->nama_kelompok,
                    'code' => $group->code,
                    'capacity' => $group->capacity,
                    'peserta_count' => $group->peserta_count,
                    'remaining_seats' => $remaining,
                    'male_count' => $group->male_count,
                    'female_count' => $group->female_count,
                    'male_min_required' => $maleMinRequired,
                    'male_target_max' => $maleTargetMax,
                    'lokasi' => $group->lokasi ? [
                        'id' => $group->lokasi->id,
                        'village_name' => $group->lokasi->village_name,
                        'district_name' => $group->lokasi->district_name,
                        'regency_name' => $group->lokasi->regency_name,
                        'full_name' => $group->lokasi->full_name ?? implode(', ', array_filter([
                            $group->lokasi->village_name,
                            $group->lokasi->district_name,
                            $group->lokasi->regency_name,
                        ])),
                    ] : null,
                ];
            });

        return $this->success([
            'periode' => [
                'id' => $periodeModel->id,
                'name' => $periodeModel->name,
                'self_service_enabled' => $periodeModel->usesSelfServiceRegistration(),
            ],
            'groups' => $groups,
            'total_capacity' => $groups->sum('capacity'),
            'total_registered' => $groups->sum('peserta_count'),
        ]);
    }

    private function checkEligibility(?Mahasiswa $mahasiswa, ?Periode $periode): array
    {
        if (! $mahasiswa || ! $periode) {
            return ['is_eligible' => false, 'reasons' => ['Data mahasiswa atau periode tidak ditemukan.']];
        }

        $eligibility = $this->eligibilityService->checkEligibility($mahasiswa, $periode->id);

        return [
            'is_eligible' => $eligibility['is_eligible'],
            'reasons' => array_column($eligibility['issues'] ?? [], 'message'),
        ];
    }

    private function getUserEligibility(?Mahasiswa $mahasiswa): array
    {
        if (! $mahasiswa) {
            return [
                'sks_completed' => 0,
                'gpa' => 0,
                'bta_ppi_passed' => false,
                'has_health_certificate' => false,
                'has_parent_permission' => false,
                'thresholds' => $this->globalEligibilityThresholds(),
            ];
        }

        return [
            'sks_completed' => $mahasiswa->sks_completed,
            'gpa' => $mahasiswa->gpa,
            'bta_ppi_passed' => in_array(strtoupper(trim($mahasiswa->status_bta_ppi ?? '')), ['LULUS', 'PASSED', 'SUCCESS']),
            'has_health_certificate' => ! empty($mahasiswa->health_certificate_path),
            'has_parent_permission' => ! empty($mahasiswa->parent_permission_path),
            // R11 audit fix: kirim threshold ke frontend supaya tidak hardcoded.
            'thresholds' => $this->globalEligibilityThresholds(),
        ];
    }

    /**
     * Default threshold dari SystemSetting (admin configurable).
     * Per-periode threshold via jenis_kkn.min_sks / min_gpa di-override di UI.
     *
     * @return array<string, float|int>
     */
    private function globalEligibilityThresholds(): array
    {
        return [
            'min_sks' => (int) SystemSetting::get('eligibility_min_sks', '100'),
            'min_gpa' => (float) SystemSetting::get('eligibility_min_gpa', '2.0'),
        ];
    }
}
