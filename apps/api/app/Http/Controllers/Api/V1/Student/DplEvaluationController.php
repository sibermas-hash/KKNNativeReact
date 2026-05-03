<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\DosenResource;
use App\Http\Resources\Api\V1\EvaluasiResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\EvaluasiDplPeserta;
use App\Models\KKN\ItemEvaluasiDplPeserta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DplEvaluationController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $user = auth()->user();
        $mahasiswa = $user->mahasiswa;
        $registration = $mahasiswa?->peserta()->where('status', 'approved')->first();

        if (! $registration?->kelompok_id) {
            return $this->success(['dpl_list' => [], 'has_submitted' => false]);
        }

        $group = $registration->kelompok;
        $dplList = $group->dosen()->wherePivot('role', 'Ketua')->get();

        $hasSubmitted = EvaluasiDplPeserta::where('mahasiswa_id', $mahasiswa->id)
            ->where('kelompok_id', $group->id)
            ->exists();

        return $this->success([
            'dpl_list' => DosenResource::collection($dplList),
            'has_submitted' => $hasSubmitted,
            'period_id' => $registration->periode_id,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();
        $mahasiswa = $user->mahasiswa;
        $registration = $mahasiswa?->peserta()->where('status', 'approved')->first();

        if (! $registration?->kelompok_id) {
            return $this->forbidden();
        }

        $validated = $request->validate([
            'dosen_id' => ['required', 'exists:dosen,id'],
            'ratings' => ['required', 'array', 'min:1'],
            'ratings.*.aspect' => ['required', 'string'],
            'ratings.*.score' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:2000'],
        ]);

        $eval = EvaluasiDplPeserta::create([
            'mahasiswa_id' => $mahasiswa->id,
            'dosen_id' => $validated['dosen_id'],
            'kelompok_id' => $registration->kelompok_id,
            'periode_id' => $registration->periode_id,
            'comment' => $validated['comment'] ?? null,
        ]);

        foreach ($validated['ratings'] as $rating) {
            ItemEvaluasiDplPeserta::create([
                'evaluasi_dpl_peserta_id' => $eval->id,
                'aspect' => $rating['aspect'],
                'score' => $rating['score'],
            ]);
        }

        return $this->created([
            'id' => $eval->id,
        ], 'Evaluasi DPL berhasil dikirim. Terima kasih atas masukan Anda.');
    }
}
