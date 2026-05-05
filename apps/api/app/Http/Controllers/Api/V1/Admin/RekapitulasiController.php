<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\DispensasiKkn;
use App\Models\KKN\EvaluasiDplPeserta;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\PesertaKkn;
use App\Services\GradeSuggestionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RekapitulasiController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $periodId = $request->input('periode_id');

        $query = PesertaKkn::where('status', 'approved')
            ->when($periodId, fn ($q, $id) => $q->where('periode_id', $id))
            ->with(['mahasiswa.user', 'mahasiswa.fakultas', 'mahasiswa.prodi', 'kelompok', 'periode']);

        $participants = $query->get();

        $rekapitulasi = $participants->map(function ($p) {
            $nilai = NilaiKkn::where('user_id', $p->mahasiswa?->user_id)
                ->where('kelompok_id', $p->kelompok_id)
                ->first();

            return [
                'id' => $p->id,
                'nama' => $p->mahasiswa?->nama ?? '-',
                'nim' => $p->mahasiswa?->nim ?? '-',
                'fakultas' => $p->mahasiswa?->fakultas?->nama ?? '-',
                'prodi' => $p->mahasiswa?->prodi?->nama ?? '-',
                'kelompok' => $p->kelompok?->nama_kelompok ?? '-',
                'lokasi' => $p->kelompok?->lokasi?->village_name ?? '-',
                'total_score' => $nilai?->total_score,
                'letter_grade' => $nilai?->letter_grade,
                'is_finalized' => $nilai?->is_finalized ?? false,
                'status' => $p->status,
            ];
        });

        return $this->success([
            'rekapitulasi' => $rekapitulasi,
            'summary' => [
                'total' => $rekapitulasi->count(),
                'finalized' => $rekapitulasi->where('is_finalized', true)->count(),
                'pending' => $rekapitulasi->where('is_finalized', false)->count(),
            ],
        ]);
    }
}
