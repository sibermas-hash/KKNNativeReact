<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StoreDplParticipantEvaluationRequest;
use App\Services\KKN\DplParticipantEvaluationService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DplParticipantEvaluationController extends Controller
{
    public function __construct(
        private readonly DplParticipantEvaluationService $service,
    ) {}

    public function index(): Response
    {
        $context = $this->service->resolveStudentContext(auth()->user());

        return Inertia::render('Student/DplEvaluation/Index', [
            'eligible' => $context['eligible'],
            'reason' => $context['reason'],
            'criteria' => $this->service->criteria(),
            'recommendationOptions' => $this->service->recommendationOptions(),
            'registration' => $context['registration'] ? [
                'period_name' => $context['registration']->periode?->name ?? '-',
            ] : null,
            'group' => $context['group'] ? [
                'id' => $context['group']->id,
                'name' => $context['group']->nama_kelompok,
                'code' => $context['group']->code,
                'location_name' => $context['group']->lokasi?->village_name ?? '-',
            ] : null,
            'dpl' => $context['dpl'] ? [
                'id' => $context['dpl']->id,
                'name' => $context['dpl']->nama ?? $context['dpl']->user?->name ?? '-',
                'nip' => $context['dpl']->nip,
            ] : null,
            'existingEvaluation' => $context['existingEvaluation'] ? [
                'id' => $context['existingEvaluation']->id,
                'total_score' => (float) $context['existingEvaluation']->total_score,
                'recommendation' => $context['existingEvaluation']->recommendation,
                'notes' => $context['existingEvaluation']->notes,
                'submitted_at' => optional($context['existingEvaluation']->submitted_at)->format('d M Y H:i'),
                'items' => $context['existingEvaluation']->items->map(fn ($item) => [
                    'criterion_key' => $item->criterion_key,
                    'criterion_label' => $item->criterion_label,
                    'score' => $item->score,
                    'weight' => $item->weight,
                ])->values(),
            ] : null,
        ]);
    }

    public function store(StoreDplParticipantEvaluationRequest $request): RedirectResponse
    {
        $this->service->store($request->user(), $request->validated());

        return redirect()
            ->route('student.evaluasi-dpl.index')
            ->with('success', 'Evaluasi DPL berhasil dikirim. Terima kasih atas umpan balik Anda.');
    }
}
