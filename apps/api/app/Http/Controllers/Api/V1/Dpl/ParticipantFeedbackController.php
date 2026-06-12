<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Dpl;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\EvaluasiDplPeserta;
use App\Services\KKN\DplParticipantEvaluationService;
use Illuminate\Http\JsonResponse;

class ParticipantFeedbackController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $dosen = auth()->user()->dosen;
        if (! $dosen) {
            return $this->success([
                'summary' => null,
                'comments' => [],
                'criteria_labels' => DplParticipantEvaluationService::CRITERIA,
            ]);
        }

        $service = app(DplParticipantEvaluationService::class);
        $summary = $service->getDplSummary($dosen->id);

        $comments = EvaluasiDplPeserta::where('dosen_id', $dosen->id)
            ->with(['mahasiswa.user', 'kelompok', 'periode', 'items'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($evaluation) {
                return [
                    'id' => $evaluation->id,
                    'group_name' => $evaluation->kelompok?->nama_kelompok ?? 'N/A',
                    'period_name' => $evaluation->periode?->name ?? 'N/A',
                    'recommendation' => $evaluation->recommendation,
                    'notes' => $evaluation->notes,
                    'submitted_at' => $evaluation->created_at?->toIso8601String(),
                ];
            });

        return $this->success([
            'summary' => $summary,
            'comments' => $comments,
            'criteria_labels' => DplParticipantEvaluationService::CRITERIA,
        ]);
    }
}
