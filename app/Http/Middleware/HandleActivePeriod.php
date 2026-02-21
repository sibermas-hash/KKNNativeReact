<?php

namespace App\Http\Middleware;

use App\Services\PeriodContextService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HandleActivePeriod
{
    public function __construct(
        private PeriodContextService $contextService
    ) {}

    /**
     * Handle an incoming request.
     * Priority: URL parameter > Session > Default (system active period)
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only for authenticated users
        if (!auth()->check()) {
            return $next($request);
        }

        // If a period switch is requested via query parameter
        if ($request->has('period_id')) {
            $periodId = (int) $request->input('period_id');
            try {
                // Only admins can freely switch periods; students/DPL stay on their enrolled period
                $user = auth()->user();
                if ($user->hasRole('superadmin') || $user->hasRole('admin')) {
                    $this->contextService->setActivePeriod($periodId);
                }
            } catch (\Throwable $e) {
                // Silently fail if period doesn't exist
            }
        }

        // If no active period in session, set the default
        if (!$this->contextService->getActivePeriodId()) {
            $defaultId = $this->contextService->getDefaultPeriodId();
            if ($defaultId) {
                $this->contextService->setActivePeriod($defaultId);
            }
        }

        // Share active period data with all Inertia responses
        if (class_exists(\Inertia\Inertia::class)) {
            \Inertia\Inertia::share('activePeriod', fn() => $this->contextService->getActivePeriodData());
            \Inertia\Inertia::share('availablePeriods', fn() => $this->contextService->getAvailablePeriods());
        }

        return $next($request);
    }
}
