<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\PeriodContextService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * CheckPeriodLock Middleware
 *
 * Mencegah aksi modifikasi (POST, PUT, PATCH, DELETE) pada periode yang sudah berstatus 'is_locked'.
 * Ini merupakan mitigasi Human Error berdasarkan PRD Section 5: State-Based Locking.
 */
class CheckPeriodLock
{
    public function __construct(
        private PeriodContextService $contextService
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        // Hanya untuk method yang memodifikasi data
        if ($request->isMethod('GET') || $request->isMethod('HEAD') || $request->isMethod('OPTIONS')) {
            return $next($request);
        }

        $period = $this->contextService->getActivePeriod();

        if ($period && $period->is_locked) {
            abort(403, 'Periode ini sudah dikunci (Selesai/Sertifikasi). Tidak ada perubahan yang diizinkan.');
        }

        return $next($request);
    }
}
