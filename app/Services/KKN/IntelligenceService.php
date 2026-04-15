<?php

declare(strict_types=1);

namespace App\Services\KKN;

use App\Models\KKN\KegiatanKkn;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class IntelligenceService
{
    /**
     * Get high-risk reports with specific anomaly insights.
     */
    public function getHighRiskAnomalies(?int $facultyId = null): Collection
    {
        // Combined risk assessment
        // 1. Short descriptions (< 30 chars)
        // 2. Placeholder text (lorem, test, etc.)
        // 3. Late submissions (between 11 PM and 4 AM)

        // Optimasi: Gunakan kriteria yang lebih cepat (length) sebagai filter utama jika memungkinkan,
        // atau batasi pencarian string hanya pada subset data terbaru untuk mengurangi beban I/O.
        $query = KegiatanKkn::with([
            'mahasiswa:id,user_id,nama',
            'mahasiswa.user:id,name',
            'kelompok:id,nama_kelompok,code',
        ])
            ->where(function ($q) {
                // Gunakan query yang lebih efisien untuk PostgreSQL
                $q->whereRaw('LENGTH(activity) < 30')
                    ->orWhereRaw("activity ~* '(lorem ipsum|test|asdf|dummy|testing)'")
                    ->orWhere(function ($hourQuery) {
                        $hourQuery->whereRaw('EXTRACT(HOUR FROM created_at) >= 23')
                            ->orWhereRaw('EXTRACT(HOUR FROM created_at) <= 4');
                    });
            });

        if ($facultyId) {
            $query->whereHas('mahasiswa', function ($q) use ($facultyId) {
                $q->where('faculty_id', $facultyId);
            });
        }

        return $query->latest()
            ->limit(50)
            ->get()
            ->map(function ($report) {
                $reasons = [];
                if (strlen($report->activity) < 30) {
                    $reasons[] = 'Deskripsi terlalu singkat';
                }
                if (preg_match('/lorem|test|asdf/i', $report->activity)) {
                    $reasons[] = 'Terindikasi teks placeholder';
                }

                $hour = $report->created_at?->hour;
                if ($hour !== null && ($hour >= 23 || $hour <= 4)) {
                    $reasons[] = "Entri waktu mencurigakan ({$hour}:00)";
                }

                return [
                    'id' => $report->id,
                    'nim' => $report->mahasiswa?->nim,
                    'student_name' => $report->mahasiswa?->nama ?? $report->mahasiswa?->user?->name,
                    'group_code' => $report->kelompok?->code,
                    'activity_preview' => substr($report->activity, 0, 50).'...',
                    'risk_level' => count($reasons) > 1 ? 'CRITICAL' : 'WARNING',
                    'reasons' => $reasons,
                    'submitted_at' => $report->created_at?->toIso8601String(),
                ];
            });
    }

    /**
     * Backward compatibility: Count only
     */
    public static function getHighRiskCount(): int
    {
        return (new self)->getHighRiskAnomalies()->count();
    }
}
