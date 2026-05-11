<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\PeriodContextService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class HandleActivePeriod
{
    public function __construct(
        private PeriodContextService $contextService
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (! auth()->check()) {
            return $next($request);
        }

        if ($request->has('periode_id')) {
            $periodId = (int) $request->input('periode_id');
            $user = auth()->user();

            try {
                if ($user->hasRole('superadmin')) {
                    $this->contextService->setActivePeriod($periodId);
                }
            } catch (\Throwable $e) {
                Log::warning('Period switch failed', [
                    'user_id' => $user->id ?? null,
                    'periode_id' => $periodId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if (! $this->contextService->getActivePeriodId()) {
            $userId = auth()->id();
            $defaultId = \Illuminate\Support\Facades\Cache::remember(
                "default_period_id_{$userId}", 60,
                fn () => $this->contextService->getDefaultPeriodId()
            );
            if ($defaultId) {
                $this->contextService->setActivePeriod($defaultId);
            }
        }

        return $next($request);
    }
}
