<?php

declare(strict_types=1);

namespace App\Http\Controllers\Dpl;

use App\Http\Controllers\Controller;
use App\Services\KKN\DplParticipantEvaluationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ParticipantFeedbackController extends Controller
{
    public function __construct(
        private readonly DplParticipantEvaluationService $service,
    ) {}

    public function index(Request $request): Response
    {
        return Inertia::render('Dpl/ParticipantFeedback/Index', $this->service->dplFeedback(
            $request->user(),
            $request->filled('period_id') ? (int) $request->integer('period_id') : null,
        ));
    }
}
