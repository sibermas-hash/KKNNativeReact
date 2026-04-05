<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\PesertaWorkshop;
use App\Models\KKN\ProgramKerja;
use App\Models\KKN\NilaiKkn;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    private function normalizeRegistrationStatus(?string $status): ?string
    {
        return match ($status) {
            'approved', 'disetujui', 'verifikasi_pusat', 'completed' => 'approved',
            'pending', 'menunggu' => 'pending',
            'rejected', 'ditolak' => 'rejected',
            default => $status,
        };
    }

    public function index(): Response
    {
        $user = auth()->user();
        $mahasiswa = $user->mahasiswa;

        // Fetch registration with related period, location, and the PRIMARY DPL (Ketua) from pivot
        $registrationModel = $mahasiswa
            ? PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
                ->with(['periode', 'kelompok.lokasi', 'kelompok.dosen' => function($q) {
                    $q->wherePivot('role', 'Ketua');
                }])
                ->latest()
                ->first()
            : null;

        $dailyReportCount = $mahasiswa
            ? $mahasiswa->kegiatan()->count()
            : 0;

        // Track work programs for better progress visual
        $workProgramCount = $registrationModel?->kelompok_id
            ? ProgramKerja::where('kelompok_id', $registrationModel->kelompok_id)->count()
            : 0;

        $finalReport = $mahasiswa
            ? $mahasiswa->laporanAkhir()->latest()->first()
            : null;

        // Fetch grade using student's user ID (consistent with scoring module)
        $grade = $mahasiswa
            ? NilaiKkn::where('user_id', $user->id)
                ->where('is_finalized', true)
                ->first()
            : null;

        // New: Workshop enrollment status (Mandatory phase in UIN SAIZU)
        $workshopRegistration = $mahasiswa
            ? PesertaWorkshop::where('user_id', $user->id)
                ->first()
            : null;

        return Inertia::render('Student/Dashboard', [
            'student' => $mahasiswa ? [
                'id' => $mahasiswa->id,
                'nim' => $mahasiswa->nim,
                'name' => $mahasiswa->nama,
                'batch_year' => $mahasiswa->batch_year,
            ] : null,
            'registration' => $registrationModel ? [
                'id' => $registrationModel->id,
                'status' => $this->normalizeRegistrationStatus($registrationModel->status),
                'notes' => $registrationModel->notes,
                'rejection_reason' => $registrationModel->rejection_reason,
                'revision_count' => (int) ($registrationModel->revision_count ?? 0),
                'last_rejected_at' => $registrationModel->last_rejected_at?->toIso8601String(),
                'resubmitted_at' => $registrationModel->resubmitted_at?->toIso8601String(),
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
                        'id' => $registrationModel->kelompok->lokasi->id,
                        'name' => $registrationModel->kelompok->lokasi->full_name ?: $registrationModel->kelompok->lokasi->village_name,
                    ] : null,
                    'lecturer' => ($registrationModel->kelompok->dosen->first() ?? $registrationModel->kelompok->dpl) ? [
                        'id' => ($registrationModel->kelompok->dosen->first() ?? $registrationModel->kelompok->dpl)->id,
                        'name' => ($registrationModel->kelompok->dosen->first() ?? $registrationModel->kelompok->dpl)->nama,
                    ] : null,
                ] : null,
            ] : null,
            'dailyReportCount' => $dailyReportCount,
            'workProgramCount' => $workProgramCount,
            'workshopRegistered' => !!$workshopRegistration,
            'finalReport' => $finalReport,
            'grade' => $grade ? [
                'id' => $grade->id,
                'score' => (float) $grade->total_score,
                'letter' => $grade->letter_grade,
                'is_finalized' => (bool) $grade->is_finalized,
            ] : null,
        ]);
    }
}
