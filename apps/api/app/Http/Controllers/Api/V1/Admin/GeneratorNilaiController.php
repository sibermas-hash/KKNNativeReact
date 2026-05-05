<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\NilaiKknResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\PesertaKkn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GeneratorNilaiController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $periodId = $request->input('periode_id');

        $groups = KelompokKkn::when($periodId, fn ($q) => $q->where('periode_id', $id))
            ->withCount('peserta')
            ->get();

        return $this->success([
            'groups' => $groups->map(fn ($g) => [
                'id' => $g->id,
                'name' => $g->nama_kelompok,
                'code' => $g->code,
                'member_count' => $g->peserta_count,
            ]),
        ]);
    }

    public function students(KelompokKkn $kelompokKkn): JsonResponse
    {
        $students = PesertaKkn::where('kelompok_id', $kelompokKkn->id)
            ->where('status', 'approved')
            ->with(['mahasiswa.user', 'mahasiswa.nilai' => fn ($q) => $q->where('kelompok_id', $kelompokKkn->id)])
            ->get();

        return $this->success([
            'students' => $students->map(fn ($s) => [
                'id' => $s->mahasiswa?->id,
                'nama' => $s->mahasiswa?->nama,
                'nim' => $s->mahasiswa?->nim,
                'nilai' => $s->mahasiswa?->nilai?->first() ? new NilaiKknResource($s->mahasiswa->nilai->first()) : null,
            ]),
        ]);
    }

    public function saveScores(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'scores' => ['required', 'array'],
            'scores.*.user_id' => ['required', 'integer'],
            'scores.*.kelompok_id' => ['required', 'integer'],
            'scores.*.scores' => ['required', 'array'],
        ]);

        $saved = 0;
        foreach ($validated['scores'] as $item) {
            NilaiKkn::updateOrCreate(
                ['user_id' => $item['user_id'], 'kelompok_id' => $item['kelompok_id']],
                array_merge($item['scores'], ['admin_graded_by' => auth()->id(), 'admin_graded_at' => now()])
            );
            $saved++;
        }

        return $this->success(['saved' => $saved], "{$saved} nilai berhasil disimpan.");
    }
}
