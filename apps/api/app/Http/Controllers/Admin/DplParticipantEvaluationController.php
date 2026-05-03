<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\Dosen;
use App\Services\KKN\DplParticipantEvaluationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class DplParticipantEvaluationController extends Controller
{
    public function __construct(
        private readonly DplParticipantEvaluationService $service,
    ) {}

    public function index(Request $request): Response
    {
        Gate::authorize('access-admin-panel');

        return Inertia::render('Admin/Academic/DplParticipantEvaluations/Index', $this->service->adminOverview(
            $request->user(),
            $request->only(['period_id', 'search', 'recommendation']),
        ));
    }

    public function show(Request $request, Dosen $dosen): Response
    {
        Gate::authorize('access-admin-panel');

        return Inertia::render('Admin/Academic/DplParticipantEvaluations/Show', $this->service->adminDetail(
            $request->user(),
            $dosen,
            $request->filled('period_id') ? (int) $request->integer('period_id') : null,
        ));
    }

    public function export(Request $request)
    {
        Gate::authorize('access-admin-panel');

        return $this->service->exportAdminOverview(
            $request->user(),
            $request->only(['period_id', 'search', 'recommendation']),
        );
    }
}
