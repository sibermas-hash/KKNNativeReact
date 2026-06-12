<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\NilaiKkn;

class YudisiumService
{
    /**
     * Hitung statistik yudisium untuk semua mahasiswa di periode tertentu.
     * SURGICAL OPTIMIZATION: Use database aggregation instead of loading objects into memory.
     */
    public function prosesYudisiumPeriode(int $periodeId): array
    {
        $baseQuery = NilaiKkn::whereHas('kelompok', function ($query) use ($periodeId) {
            $query->where('periode_id', $periodeId);
        })->where('is_finalized', true);

        return [
            'total' => (clone $baseQuery)->count(),
            'lulus' => (clone $baseQuery)->where('total_score', '>=', 56)->count(),
            'tidak_lulus' => (clone $baseQuery)->where('total_score', '<', 56)->whereNotNull('total_score')->count(),
            'pending' => (clone $baseQuery)->whereNull('total_score')->count(),
        ];
    }

    /**
     * Tentukan status kelulusan berdasarkan nilai akhir.
     */
    public function tentukanStatusKelulusan(NilaiKkn $nilai): string
    {
        // Nilai minimum lulus: C (skor >= 56)
        $minSkorLulus = 56;

        if ($nilai->total_score === null) {
            return 'pending';
        }

        // Audit R11-FULL-025 fix: round(2) untuk avoid FP edge case.
        if (round((float) $nilai->total_score, 2) >= $minSkorLulus) {
            return 'lulus';
        }

        return 'tidak_lulus';
    }

    /**
     * Generate rekap yudisium untuk sidang.
     * SURGICAL OPTIMIZATION: Use database aggregation for counts and cursor for mapping.
     */
    public function generateRekapYudisium(int $periodeId): array
    {
        $baseQuery = NilaiKkn::whereHas('kelompok', function ($query) use ($periodeId) {
            $query->where('periode_id', $periodeId);
        })->where('is_finalized', true);

        $stats = $this->prosesYudisiumPeriode($periodeId);

        $mahasiswa = $baseQuery->with(['mahasiswa.prodi.fakultas', 'kelompok'])
            ->cursor()
            ->map(function ($nilai) {
                return [
                    'nim' => $nilai->mahasiswa?->nim,
                    'nama' => $nilai->mahasiswa?->nama,
                    'fakultas' => $nilai->mahasiswa?->prodi?->fakultas?->nama,
                    'prodi' => $nilai->mahasiswa?->prodi?->nama,
                    'kelompok' => $nilai->kelompok?->nama_kelompok,
                    'skor_akhir' => $nilai->total_score,
                    'nilai_huruf' => $nilai->letter_grade,
                    'status' => $this->tentukanStatusKelulusan($nilai),
                ];
            })
            ->toArray();

        return [
            'total' => $stats['total'],
            'lulus' => $stats['lulus'],
            'tidak_lulus' => $stats['tidak_lulus'],
            'mahasiswa' => $mahasiswa,
        ];
    }
}
