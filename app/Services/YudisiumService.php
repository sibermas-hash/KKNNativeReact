<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\NilaiKkn;
use Illuminate\Support\Facades\DB;

class YudisiumService
{
    /**
     * Hitung dan proses yudisium untuk semua mahasiswa di periode tertentu
     */
    public function prosesYudisiumPeriode(int $periodeId): array
    {
        return DB::transaction(function () use ($periodeId) {
            // FIX C13: Use correct column name 'period_id' via relationship
            $nilaiFinalized = NilaiKkn::whereHas('kelompok', function ($query) use ($periodeId) {
                $query->where('period_id', $periodeId);
            })
                ->where('is_finalized', true)
                ->with(['mahasiswa'])
                ->get();

            $lulus = 0;
            $tidakLulus = 0;
            $pending = 0;

            foreach ($nilaiFinalized as $nilai) {
                $result = $this->tentukanStatusKelulusan($nilai);

                match ($result) {
                    'lulus' => $lulus++,
                    'tidak_lulus' => $tidakLulus++,
                    default => $pending++
                };
            }

            return [
                'total' => $nilaiFinalized->count(),
                'lulus' => $lulus,
                'tidak_lulus' => $tidakLulus,
                'pending' => $pending,
            ];
        });
    }

    /**
     * Tentukan status kelulusan berdasarkan nilai akhir
     */
    public function tentukanStatusKelulusan(NilaiKkn $nilai): string
    {
        // Nilai minimum lulus: C (skor >= 56)
        $minSkorLulus = 56;

        // FIX: Use correct column name 'total_score' (not 'final_score')
        if ($nilai->total_score === null) {
            return 'pending';
        }

        if ($nilai->total_score >= $minSkorLulus) {
            return 'lulus';
        }

        return 'tidak_lulus';
    }

    /**
     * Generate rekap yudisium untuk sidang
     */
    public function generateRekapYudisium(int $periodeId): array
    {
        // FIX C13: Use correct column name 'period_id' via relationship
        $nilaiPerMahasiswa = NilaiKkn::whereHas('kelompok', function ($query) use ($periodeId) {
            $query->where('period_id', $periodeId);
        })
            ->where('is_finalized', true)
            ->with(['mahasiswa.prodi.fakultas', 'kelompok'])
            ->get()
            ->map(function ($nilai) {
                $status = $this->tentukanStatusKelulusan($nilai);

                return [
                    'nim' => $nilai->mahasiswa?->nim,
                    'nama' => $nilai->mahasiswa?->nama,
                    'fakultas' => $nilai->mahasiswa?->prodi?->fakultas?->nama,
                    'prodi' => $nilai->mahasiswa?->prodi?->nama,
                    'kelompok' => $nilai->kelompok?->nama_kelompok,
                    // FIX: Use correct column name 'total_score' (not 'final_score')
                    'skor_akhir' => $nilai->total_score,
                    'nilai_huruf' => $nilai->letter_grade,
                    'status' => $status,
                ];
            });

        return [
            'total' => $nilaiPerMahasiswa->count(),
            'lulus' => $nilaiPerMahasiswa->where('status', 'lulus')->count(),
            'tidak_lulus' => $nilaiPerMahasiswa->where('status', 'tidak_lulus')->count(),
            'mahasiswa' => $nilaiPerMahasiswa->values()->toArray(),
        ];
    }
}
