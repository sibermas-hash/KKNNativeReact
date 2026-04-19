<?php

declare(strict_types=1);

namespace App\Repositories;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class KknScoreRepository
{
    /**
     * Ambil semua nilai mahasiswa dalam satu query JOIN,
     * sudah termasuk kalkulasi nilai akhir dan konversi huruf.
     * Siap untuk export ke Excel atau tampil di tabel.
     */
    public function getRekapNilai(int $periodeId, array $filters = []): Collection
    {
        return DB::table('mahasiswa as s')
            ->join('users as u', 's.user_id', '=', 'u.id')
            ->join('peserta_kkn as r', 's.id', '=', 'r.mahasiswa_id')
            ->join('kelompok_kkn as g', 'r.kelompok_id', '=', 'g.id')
            ->join('lokasi as lok', 'g.location_id', '=', 'lok.id')
            ->leftJoin('dosen as dpl_l', 'g.dpl_id', '=', 'dpl_l.id')
            ->leftJoin('users as dpl_u', 'dpl_l.user_id', '=', 'dpl_u.id')
            ->leftJoin('fakultas as fak', 's.fakultas_id', '=', 'fak.id')
            ->leftJoin('prodi as prodi', 's.prodi_id', '=', 'prodi.id')
            ->leftJoin('nilai_kkn as ks', function ($join) {
                $join->on('ks.user_id', '=', 'u.id')
                    ->on('ks.kelompok_id', '=', 'g.id');
            })
            ->where('g.periode_id', $periodeId)
            ->when($filters['search'] ?? null, function ($query, $search) {
                $value = str_replace(['%', '_'], ['\\%', '\\_'], trim((string) $search));

                $query->where(function ($inner) use ($value) {
                    $inner->where('u.name', 'like', "%{$value}%")
                        ->orWhere('s.nim', 'like', "%{$value}%")
                        ->orWhere('g.code', 'like', "%{$value}%")
                        ->orWhere('g.nama_kelompok', 'like', "%{$value}%")
                        ->orWhere('fak.nama', 'like', "%{$value}%")
                        ->orWhere('prodi.nama', 'like', "%{$value}%");
                });
            })
            ->when($filters['fakultas_id'] ?? null, fn ($q, $v) => $q->where('s.fakultas_id', $v))
            ->when($filters['kelompok_id'] ?? null, fn ($q, $v) => $q->where('g.id', $v))
            ->when($filters['huruf'] ?? null, fn ($q, $v) => $q->where('ks.letter_grade', $v))
            ->select([
                'ks.id as score_id',
                's.id as mahasiswa_id',
                'u.id as user_id',
                'u.name as nama',
                's.nim',
                'fak.nama as fakultas',
                'prodi.nama as prodi',
                'g.code as kode_kelompok',
                'g.nama_kelompok as group_name',
                'g.id as kelompok_id',
                'lok.village_name as desa',
                'dpl_u.name as nama_dpl',
                'ks.dpl_weighted_score as n_dpl',
                'ks.village_weighted_score as n_mitra',
                'ks.lppm_weighted_score as n_admin',
                // Komponen A
                'ks.final_report_score as nilai_laporan_akhir',
                'ks.execution_score as nilai_pelaksanaan',
                'ks.article_score as nilai_artikel',
                // Komponen B
                'ks.attitude_score as nilai_sikap',
                'ks.discipline_score as nilai_kedisiplinan',
                // Komponen C
                'ks.administration_score as nilai_administrasi',
                // Output
                'ks.total_score as nilai_akhir',
                'ks.letter_grade as huruf',
                'ks.is_finalized',
                'ks.evidence_file',
                'ks.dpl_graded_at as dpl_submitted_at',
                'ks.village_graded_at as mitra_submitted_at',
                'ks.admin_graded_at as admin_submitted_at',
            ])
            ->orderBy('g.code')
            ->orderBy('u.name')
            ->get();
    }
}
