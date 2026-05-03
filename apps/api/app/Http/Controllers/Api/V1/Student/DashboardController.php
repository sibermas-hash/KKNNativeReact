<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\KegiatanKknResource;
use App\Http\Resources\Api\V1\LaporanAkhirResource;
use App\Http\Resources\Api\V1\NilaiKknResource;
use App\Http\Resources\Api\V1\ProgramKerjaResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\LaporanAkhir;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\ProgramKerja;
use App\Services\PeriodContextService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use ApiResponse;

    public function index(PeriodContextService $periodContextService): JsonResponse
    {
        $user = auth()->user();
        $mahasiswa = $user->mahasiswa;

        if (! $mahasiswa) {
            return $this->forbidden('Profil mahasiswa tidak ditemukan.');
        }

        $activePeriodId = $periodContextService->getActivePeriodId() ?? $periodContextService->getDefaultPeriodId();

        $registration = PesertaKkn::query()
            ->where('mahasiswa_id', $mahasiswa->id)
            ->when($activePeriodId, fn ($q) => $q->where('periode_id', $activePeriodId))
            ->with(['periode.jenisKkn', 'kelompok.lokasi', 'kelompok.dosen' => function ($q) {
                $q->wherePivot('role', 'Ketua');
            }])
            ->latest('created_at')
            ->first();

        $activeGroupId = $registration?->kelompok_id;

        $dailyReportCount = ($mahasiswa->id && $activeGroupId)
            ? KegiatanKkn::where('mahasiswa_id', $mahasiswa->id)
                ->where('kelompok_id', $activeGroupId)
                ->count()
            : 0;

        $workProgramCount = $activeGroupId
            ? ProgramKerja::where('kelompok_id', $activeGroupId)->count()
            : 0;

        $finalReport = ($mahasiswa->id && $activeGroupId)
            ? LaporanAkhir::where('mahasiswa_id', $mahasiswa->id)
                ->where('kelompok_id', $activeGroupId)
                ->latest('submitted_at')
                ->latest('id')
                ->first()
            : null;

        $grade = ($user->id && $activeGroupId)
            ? NilaiKkn::where('user_id', $user->id)
                ->where('kelompok_id', $activeGroupId)
                ->where('is_finalized', true)
                ->latest('admin_graded_at')
                ->latest('id')
                ->first()
            : null;

        return $this->success([
            'student' => [
                'id' => $mahasiswa->id,
                'nim' => $mahasiswa->nim,
                'name' => $mahasiswa->nama,
                'avatar' => $user->avatar,
                'batch_year' => $mahasiswa->batch_year,
            ],
            'registration' => $registration ? [
                'id' => $registration->id,
                'status' => $this->normalizeStatus($registration->status),
                'notes' => $registration->notes,
                'rejection_reason' => $registration->rejection_reason,
                'role' => $registration->role,
                'notification_shown' => (bool) $registration->notification_shown,
                'period' => $registration->periode ? [
                    'id' => $registration->periode->id,
                    'name' => $registration->periode->name,
                    'jenis' => $registration->periode->jenisKkn?->name,
                ] : null,
                'group' => $registration->kelompok ? [
                    'id' => $registration->kelompok->id,
                    'code' => $registration->kelompok->code,
                    'name' => $registration->kelompok->nama_kelompok,
                    'location' => $registration->kelompok->lokasi ? [
                        'id' => $registration->kelompok->lokasi->id,
                        'name' => $registration->kelompok->lokasi->full_name ?: $registration->kelompok->lokasi->village_name,
                    ] : null,
                    'lecturer' => $registration->kelompok->dosen->first() ? [
                        'id' => $registration->kelompok->dosen->first()->id,
                        'name' => $registration->kelompok->dosen->first()->nama,
                    ] : null,
                ] : null,
            ] : null,
            'daily_report_count' => $dailyReportCount,
            'work_program_count' => $workProgramCount,
            'final_report' => $finalReport ? new LaporanAkhirResource($finalReport) : null,
            'grade' => $grade ? [
                'id' => $grade->id,
                'score' => (float) $grade->total_score,
                'letter' => trim((string) $grade->letter_grade),
                'is_finalized' => (bool) $grade->is_finalized,
                'is_eligible_certificate' => $grade->total_score >= 70,
            ] : null,
        ]);
    }

    public function markNotificationShown(Request $request, PesertaKkn $pesertaKkn): JsonResponse
    {
        $user = auth()->user();

        if ($pesertaKkn->mahasiswa_id !== $user->mahasiswa?->id) {
            return $this->forbidden();
        }

        $pesertaKkn->update(['notification_shown' => true]);

        return $this->noContent('Notifikasi ditandai sudah dibaca.');
    }

    private function normalizeStatus(?string $status): ?string
    {
        return match ($status) {
            'approved', 'disetujui', 'verifikasi_pusat', 'completed' => 'approved',
            'pending', 'menunggu', 'document_submitted', 'document_verified' => 'pending',
            'rejected', 'ditolak', 'gugur' => 'rejected',
            default => $status,
        };
    }
}
