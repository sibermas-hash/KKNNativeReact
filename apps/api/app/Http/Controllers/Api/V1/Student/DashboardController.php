<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\AnnouncementResource;
use App\Http\Resources\Api\V1\LaporanAkhirResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Announcement;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\LaporanAkhir;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\ProgramKerja;
use App\Models\KKN\SystemSetting;
use App\Models\User;
use App\Services\PeriodContextService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use ApiResponse;

    public function index(PeriodContextService $periodContextService): JsonResponse
    {
        /** @var User|null $user */
        $user = auth()->user();
        $mahasiswa = $user->mahasiswa;

        if (! $mahasiswa) {
            return $this->forbidden('Profil mahasiswa tidak ditemukan.');
        }

        $activePeriodId = $periodContextService->getActivePeriodId() ?? $periodContextService->getDefaultPeriodId();

        $registration = PesertaKkn::withoutGlobalScope('isolasi_periode')
            ->where('mahasiswa_id', $mahasiswa->id)
            // Jangan tampilkan "Belum Daftar" jika mahasiswa sudah punya peserta_kkn
            // di periode lain. Prioritaskan periode aktif, fallback ke pendaftaran terbaru.
            ->when($activePeriodId, fn ($q) => $q->orderByRaw('CASE WHEN periode_id = ? THEN 0 ELSE 1 END', [$activePeriodId]))
            ->with([
                'periode.jenisKkn',
                'kelompok.lokasi',
                'kelompok.dosen' => fn ($q) => $q->wherePivot('role', 'Ketua'),
                // Audit FLOW-003 fix: include kelompok's student leader so FE
                // tidak perlu hardcode "Sedang Ditentukan". Eager-load hanya
                // relasi minimum (mahasiswa.nama) untuk UI.
                'kelompok.peserta' => fn ($q) => $q->ketua()->with('mahasiswa:id,user_id,nama,nim'),
            ])
            ->latest('created_at')
            ->first();

        $placementIsLive = (bool) ($registration?->placement_is_live ?? false);
        $activeGroupId = $placementIsLive ? $registration?->kelompok_id : null;
        if ($registration && ! $placementIsLive) {
            $registration->setRelation('kelompok', null);
        }

        $dailyReportCount = ($mahasiswa->id && $activeGroupId)
            ? KegiatanKkn::where('mahasiswa_id', $mahasiswa->id)
                ->where('kelompok_id', $activeGroupId)
                ->where('status', 'approved')
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

        $certificateMinScore = (float) SystemSetting::get('certificate_min_score', '70');
        $minDailyReports = (int) SystemSetting::get('min_daily_reports', '30');
        $dashboardAnnouncements = Announcement::query()
            ->active()
            ->forTarget(Announcement::TARGET_STUDENT_DASHBOARD)
            ->ordered()
            ->limit(5)
            ->get();

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
                'placement_is_live' => $placementIsLive,
                'period' => $registration->periode ? [
                    'id' => $registration->periode->id,
                    'name' => $registration->periode->name,
                    // Audit REGULER-005 fix: expose jenis KKN dengan label + code
                    // supaya FE bisa render badge yang jelas. Sebelumnya hanya
                    // `jenis` (name) yang include.
                    'jenis' => $registration->periode->jenisKkn?->name,
                    'jenis_code' => $registration->periode->jenisKkn?->code,
                    'jenis_color' => $registration->periode->jenisKkn?->color,
                    'jenis_description' => $registration->periode->jenisKkn?->description,
                    'current_phase' => $registration->periode->current_phase,
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
                    // Audit FLOW-003 fix: expose ketua mahasiswa dari DB.
                    // FE dulunya hardcode "Sedang Ditentukan".
                    'leader' => $this->leaderPayload($registration->kelompok, (int) $mahasiswa->id),
                    'leader_voting' => $this->leaderVotingPayload($registration),
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
                // Audit F-14 fix: threshold dari SystemSetting (default 70).
                // Audit R11-FULL-025 fix: explicit round(2) sebelum compare
                // untuk avoid 69.9999999 < 70 floating-point edge case.
                'is_eligible_certificate' => round((float) $grade->total_score, 2) >= $certificateMinScore,
            ] : null,
            // FE gunakan value ini untuk info "nilai minimum sertifikat" — jangan hardcode di UI.
            'certificate_min_score' => $certificateMinScore,
            'min_daily_reports' => $minDailyReports,
            'dashboard_announcements' => AnnouncementResource::collection($dashboardAnnouncements),
        ]);
    }

    public function markNotificationShown(Request $request, PesertaKkn $pesertaKkn): JsonResponse
    {
        /** @var User|null $user */
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
            'approved', 'disetujui', 'verifikasi_pusat' => 'approved',
            'completed', 'selesai' => 'completed',
            'pending', 'menunggu', 'document_submitted', 'document_verified' => 'pending',
            'rejected', 'ditolak', 'gugur' => 'rejected',
            default => $status,
        };
    }

    private function leaderVotingPayload(PesertaKkn $registration): ?array
    {
        if (! $registration->placement_is_live || ! $registration->kelompok_id) {
            return null;
        }

        if (strtolower((string) $registration->role) === 'ketua') {
            return ['open' => false, 'required' => false, 'reason' => 'leader_elected'];
        }

        $starts = $registration->placement_published_at ?? $registration->joined_group_at ?? $registration->updated_at;
        $ends = $starts ? $starts->copy()->addDays(7) : now()->subSecond();

        return [
            'open' => now()->betweenIncluded($starts, $ends),
            'required' => now()->lessThanOrEqualTo($ends),
            'starts_at' => $starts?->toIso8601String(),
            'ends_at' => $ends->toIso8601String(),
            'endpoint' => '/api/v1/student/group-leader-vote',
        ];
    }

    /**
     * Render info ketua kelompok untuk dashboard student.
     * Dipisah agar type-hints PesertaKkn/Mahasiswa jelas buat PHPStan.
     *
     * @return array{id: ?int, name: ?string, nim: ?string, is_self: bool}|null
     */
    private function leaderPayload(KelompokKkn $kelompok, int $currentMahasiswaId): ?array
    {
        /** @var PesertaKkn|null $leader */
        $leader = $kelompok->peserta->first();
        if (! $leader) {
            return null;
        }

        /** @var Mahasiswa|null $mhs */
        $mhs = $leader->mahasiswa;
        if (! $mhs) {
            return ['id' => null, 'name' => null, 'nim' => null, 'is_self' => false];
        }

        return [
            'id' => (int) $mhs->id,
            'name' => $mhs->nama,
            'nim' => $mhs->nim,
            'is_self' => (int) $mhs->id === $currentMahasiswaId,
        ];
    }
}
