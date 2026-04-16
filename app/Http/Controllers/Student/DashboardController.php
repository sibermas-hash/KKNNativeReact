<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\LaporanAkhir;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\ProgramKerja;
use App\Services\PeriodContextService;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    private function normalizeRegistrationStatus(?string $status): ?string
    {
        return match ($status) {
            'approved', 'disetujui', 'verifikasi_pusat', 'completed' => 'approved',
            'pending', 'menunggu' => 'pending',
            'rejected', 'ditolak', 'gugur' => 'rejected',
            default => $status,
        };
    }

    public function index(PeriodContextService $periodContextService): Response
    {
        $user = auth()->user();
        $mahasiswa = $user->mahasiswa;

        // Cache touch removed due to driver incompatibility in current environment

        $activePeriodId = $periodContextService->getActivePeriodId() ?? $periodContextService->getDefaultPeriodId();

        $registrationModel = null;
        if ($mahasiswa) {
            $registrationQuery = PesertaKkn::query()
                ->where('mahasiswa_id', $mahasiswa->id)
                ->with(['periode', 'kelompok.lokasi', 'kelompok.dosen' => function ($q) {
                    $q->wherePivot('role', 'Ketua');
                }]);

            if ($activePeriodId) {
                $registrationModel = (clone $registrationQuery)
                    ->where('period_id', $activePeriodId)
                    ->latest('created_at')
                    ->first();
            }

            $registrationModel ??= $registrationQuery
                ->latest('created_at')
                ->first();
        }

        $activeGroupId = $registrationModel?->kelompok_id;

        $mahasiswaId = $mahasiswa?->id;

        return Inertia::render('Student/Dashboard', [
            'student' => $mahasiswa ? [
                'id' => $mahasiswa->id,
                'nim' => $mahasiswa->nim,
                'name' => $mahasiswa->nama,
                'avatar' => $user->avatar,
                'batch_year' => $mahasiswa->batch_year,
            ] : null,
            'registration' => $registrationModel ? [
                'id' => $registrationModel->id,
                'status' => $this->normalizeRegistrationStatus($registrationModel->status),
                'notes' => $registrationModel->notes,
                'rejection_reason' => $registrationModel->rejection_reason,
                'role' => $registrationModel->role,
                'period' => $registrationModel->periode ? [
                    'id' => $registrationModel->periode->id,
                    'name' => $registrationModel->periode->name,
                    'min_logbook' => $registrationModel->periode->min_logbook ?? 30,
                ] : null,
                'group' => $registrationModel->kelompok ? [
                    'id' => $registrationModel->kelompok->id,
                    'code' => $registrationModel->kelompok->code,
                    'name' => $registrationModel->kelompok->nama_kelompok,
                    'location' => $registrationModel->kelompok->lokasi ? [
                        'id' => $registrationModel->kelompok->id,
                        'name' => $registrationModel->kelompok->lokasi->full_name ?: $registrationModel->kelompok->lokasi->village_name,
                    ] : null,
                    'lecturer' => ($registrationModel->kelompok && $registrationModel->kelompok->dosen->first()) ? [
                        'id' => $registrationModel->kelompok->dosen->first()->id,
                        'name' => $registrationModel->kelompok->dosen->first()->nama,
                    ] : null,
                ] : null,
            ] : null,
            'dailyReportCount' => ($mahasiswaId && $activeGroupId)
                ? KegiatanKkn::query()
                    ->where('mahasiswa_id', $mahasiswaId)
                    ->where('kelompok_id', $activeGroupId)
                    ->count()
                : 0,
            'workProgramCount' => $activeGroupId
                ? ProgramKerja::where('kelompok_id', $activeGroupId)->count()
                : 0,
            'finalReport' => ($mahasiswaId && $activeGroupId)
                ? LaporanAkhir::query()
                    ->where('mahasiswa_id', $mahasiswaId)
                    ->where('kelompok_id', $activeGroupId)
                    ->latest('submitted_at')
                    ->latest('id')
                    ->first()
                : null,
            'grade' => function () use ($user, $activeGroupId) {
                $grade = ($user->id && $activeGroupId)
                    ? NilaiKkn::where('user_id', $user->id)
                        ->where('kelompok_id', $activeGroupId)
                        ->where('is_finalized', true)
                        ->latest('admin_graded_at')
                        ->latest('id')
                        ->first()
                    : null;

                return $grade ? [
                    'id' => $grade->id,
                    'score' => (float) $grade->total_score,
                    'letter' => trim((string) $grade->letter_grade),
                    'is_finalized' => (bool) $grade->is_finalized,
                    'is_eligible_certificate' => $grade->total_score >= 70,
                ] : null;
            },
        ]);
    }
}
