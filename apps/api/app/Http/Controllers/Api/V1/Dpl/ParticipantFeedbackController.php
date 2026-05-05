<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Dpl;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\EvaluasiDplPeserta;
use Illuminate\Http\JsonResponse;

class ParticipantFeedbackController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $dosen = auth()->user()->dosen;
        if (! $dosen) {
            return $this->success(['feedback' => []]);
        }

        $feedback = EvaluasiDplPeserta::where('dosen_id', $dosen->id)
            ->with(['mahasiswa.user', 'items'])
            ->orderByDesc('created_at')
            ->paginate(25);

        return $this->successCollection(
            \App\Http\Resources\Api\V1\EvaluasiDplPesertaResource::collection($feedback)
        );
    }
}
