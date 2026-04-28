<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Services\EligibilityService;
use App\Services\KKN\RegistrationDocumentService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KknDaftarController extends Controller
{
    public function index(Request $request, RegistrationDocumentService $documentService): Response
    {
        $user = $request->user();
        $mahasiswa = $user?->mahasiswa;

        // Cek apakah mahasiswa sudah pernah mendaftar/mengikuti KKN (jenis apapun)
        $existingRegistration = null;
        $hasRegistered = false;
        if ($mahasiswa) {
            $existingRegistration = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
                ->whereNotIn('status', ['rejected', 'cancelled']) // Ditolak/batal boleh daftar ulang
                ->with('periode.jenisKkn')
                ->first();
            $hasRegistered = (bool) $existingRegistration;
        }

        $periods = Periode::where('is_active', true)
            ->whereIn('current_phase', ['registration', 'placement', 'execution'])
            ->with(['jenisKkn', 'tahunAkademik'])
            ->orderByDesc('registration_start')
            ->get()
            ->map(function ($p) use ($documentService, $mahasiswa, $hasRegistered) {
                $jenis = $p->jenisKkn;
                $canRegister = in_array($p->current_phase, ['registration', 'placement']);

                $eligibility = $this->checkEligibility($mahasiswa, $p);
                $documentRequirements = $documentService->requirementsForPeriod($p);

                // Jika sudah pernah daftar KKN apapun, tidak boleh daftar lagi
                if ($hasRegistered) {
                    $canRegister = false;
                }

                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'jenis' => [
                        'id' => $jenis?->id,
                        'name' => $jenis?->name,
                        'code' => $jenis?->code,
                        'description' => $jenis?->description,
                    ],
                    'requirements' => [
                        'config' => $jenis?->requirements_config ?? [],
                        'documents' => collect($documentRequirements)
                            ->pluck('label')
                            ->values()
                            ->all(),
                    ],
                    'program_type' => $p->program_type,
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

        $userEligibility = $this->getUserEligibility($mahasiswa);

        return Inertia::render('Student/KknDaftar', [
            'periods' => $periods,
            'user_eligibility' => $userEligibility,
            'registration_status' => $existingRegistration ? [
                'has_registered' => true,
                'status' => $existingRegistration->status,
                'period_name' => $existingRegistration->periode?->name ?? '-',
                'jenis_name' => $existingRegistration->periode?->jenisKkn?->name ?? '-',
                'registered_at' => $existingRegistration->registration_date?->format('d/m/Y'),
            ] : [
                'has_registered' => false,
            ],
        ]);
    }

    private function checkEligibility(?Mahasiswa $mahasiswa, ?Periode $periode): array
    {
        if (! $mahasiswa) {
            return [
                'is_eligible' => false,
                'reasons' => ['Data mahasiswa tidak ditemukan. Silakan hubungi administrator.'],
            ];
        }

        if (! $periode) {
            return [
                'is_eligible' => false,
                'reasons' => ['Data periode tidak ditemukan.'],
            ];
        }

        $eligibility = app(EligibilityService::class)->checkEligibility($mahasiswa, $periode->id);

        return [
            'is_eligible' => $eligibility['is_eligible'],
            'reasons' => array_column($eligibility['issues'], 'message'),
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
            ];
        }

        $btaPassed = strtoupper(trim($mahasiswa->status_bta_ppi ?? ''));

        return [
            'sks_completed' => $mahasiswa->sks_completed,
            'gpa' => $mahasiswa->gpa,
            'bta_ppi_passed' => in_array($btaPassed, ['LULUS', 'PASSED', 'SUCCESS']),
            'has_health_certificate' => ! empty($mahasiswa->health_certificate_path),
            'has_parent_permission' => ! empty($mahasiswa->parent_permission_path),
        ];
    }
}
