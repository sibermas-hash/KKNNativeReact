<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Services\KKN\DplParticipantEvaluationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DplEvaluationController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly DplParticipantEvaluationService $service,
    ) {}

    public function index(): JsonResponse
    {
        $context = $this->service->resolveStudentContext(auth()->user());

        return $this->success([
            'eligible'              => $context['eligible'],
            'reason'                => $context['reason'] ?? null,
            'criteria'              => $this->service->criteria(),
            'recommendation_options' => $this->service->recommendationOptions(),
            'registration'          => $context['registration'] ? [
                'period_name' => $context['registration']->periode?->name ?? '-',
            ] : null,
            'group'                 => $context['group'] ? [
                'id'            => $context['group']->id,
                'name'          => $context['group']->nama_kelompok,
                'code'          => $context['group']->code,
                'location_name' => $context['group']->lokasi?->village_name ?? '-',
            ] : null,
            'dpl'                   => $context['dpl'] ? [
                'id'   => $context['dpl']->id,
                'name' => $context['dpl']->nama ?? $context['dpl']->user?->name ?? '-',
                'nip'  => $context['dpl']->nip,
            ] : null,
            'existing_evaluation'   => $context['existingEvaluation'] ? [
                'id'           => $context['existingEvaluation']->id,
                'total_score'  => (float) $context['existingEvaluation']->total_score,
                'recommendation' => $context['existingEvaluation']->recommendation,
                'notes'        => $context['existingEvaluation']->notes,
                'submitted_at' => $context['existingEvaluation']->submitted_at?->toIso8601String(),
                'items'        => $context['existingEvaluation']->items->map(fn ($item) => [
                    'criterion_key'   => $item->criterion_key,
                    'criterion_label' => $item->criterion_label,
                    'score'           => $item->score,
                    'weight'          => $item->weight,
                ])->values(),
            ] : null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'scores'         => ['required', 'array'],
            'recommendation' => ['required', 'string', 'in:'.implode(',', array_keys($this->service->recommendationOptions()))],
            'notes'          => ['nullable', 'string', 'max:2000'],
        ]);

        $this->service->store($request->user(), $request->validated());

        return $this->created([], 'Evaluasi DPL berhasil dikirim. Terima kasih atas umpan balik Anda.');
    }
}
