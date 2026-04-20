<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\KKN\JenisKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KknDaftarController extends Controller
{
    public function index(Request $request): Response
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
            ->map(function ($p) use ($mahasiswa, $hasRegistered) {
                $jenis = $p->jenisKkn;
                $canRegister = in_array($p->current_phase, ['registration', 'placement']);

                $eligibility = $this->checkEligibility($mahasiswa, $jenis);

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
                        'min_sks' => $jenis?->min_sks ?? 100,
                        'min_gpa' => $jenis?->min_gpa ?? 2.0,
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

    private function checkEligibility(?Mahasiswa $mahasiswa, ?JenisKkn $jenis): array
    {
        if (! $mahasiswa) {
            return [
                'is_eligible' => false,
                'reasons' => ['Data mahasiswa tidak ditemukan. Silakan hubungi administrator.'],
            ];
        }

        if (! $jenis) {
            return [
                'is_eligible' => false,
                'reasons' => ['Konfigurasi jenis KKN belum tersedia.'],
            ];
        }

        $reasons = [];
        $minSks = $jenis->min_sks ?? 100;
        $minGpa = $jenis->min_gpa ?? 2.0;

        if (($mahasiswa->sks_completed ?? 0) < $minSks) {
            $reasons[] = "SKS belum mencukupi ({$mahasiswa->sks_completed}/{$minSks})";
        }

        if (($mahasiswa->gpa ?? 0) < $minGpa) {
            $reasons[] = 'IPK belum mencukupi ('.number_format($mahasiswa->gpa ?? 0, 2)."/{$minGpa})";
        }

        $btaPassed = strtoupper(trim($mahasiswa->status_bta_ppi ?? ''));
        if (! in_array($btaPassed, ['LULUS', 'PASSED', 'SUCCESS'])) {
            $reasons[] = 'Anda belum lulus BTA/PPI';
        }

        return [
            'is_eligible' => empty($reasons),
            'reasons' => $reasons,
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
