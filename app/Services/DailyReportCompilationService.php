<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\PesertaKkn;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;

class DailyReportCompilationService
{
    /**
     * Generate PDF compilation of daily reports for a student.
     */
    public function generateForStudent(int $userId): \Barryvdh\DomPDF\PDF
    {
        $user = User::with(['mahasiswa.prodi.fakultas'])->findOrFail($userId);

        if (! $user->mahasiswa) {
            throw new \RuntimeException('User tidak memiliki data mahasiswa.');
        }

        // Get student's registration and group
        $registration = PesertaKkn::with(['kelompok.lokasi', 'kelompok.dosen.user'])
            ->where('mahasiswa_id', $user->mahasiswa->id)
            ->latest()
            ->first();

        // Get daily reports
        $reports = KegiatanKkn::where('mahasiswa_id', $user->mahasiswa->id)
            ->orderBy('date')
            ->get();

        // Calculate statistics
        $stats = [
            'total' => $reports->count(),
            'approved' => $reports->where('status', 'approved')->count(),
            'pending' => $reports->where('status', 'submitted')->count(), // submitted is pending in this context
            'revision' => $reports->where('status', 'revision')->count(),
            'rejected' => $reports->where('status', 'rejected')->count(),
            'completion_rate' => $reports->count() > 0
                ? round(($reports->where('status', 'approved')->count() / $reports->count()) * 100, 2)
                : 0,
        ];

        $pdf = Pdf::loadView('pdf.daily-report-compilation', [
            'user' => $user,
            'registration' => $registration,
            'reports' => $reports,
            'stats' => $stats,
            'generatedAt' => now()->format('d F Y H:i'),
        ]);

        $pdf->setPaper('A4');

        return $pdf;
    }

    /**
     * Generate PDF summary of daily reports for a group.
     */
    public function generateForGroup(int $groupId): \Barryvdh\DomPDF\PDF
    {
        $group = KelompokKkn::with(['lokasi', 'dosen.user', 'peserta.mahasiswa.user'])->findOrFail($groupId);

        $mahasiswaIds = $group->peserta->pluck('mahasiswa_id');

        $reports = KegiatanKkn::whereIn('mahasiswa_id', $mahasiswaIds)
            ->with('mahasiswa.user')
            ->orderBy('date')
            ->get();

        $pdf = Pdf::loadView('pdf.group-report-summary', [
            'group' => $group,
            'reports' => $reports,
            'generatedAt' => now()->format('d F Y H:i'),
        ]);

        $pdf->setPaper('A4');

        return $pdf;
    }
}
