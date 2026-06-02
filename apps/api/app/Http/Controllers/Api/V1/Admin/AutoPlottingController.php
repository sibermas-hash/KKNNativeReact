<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Services\KKN\AutoPlottingService;
use App\Models\KKN\Periode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AutoPlottingController extends Controller
{
    use ApiResponse;

    public function simulate(Request $request, AutoPlottingService $service): JsonResponse
    {
        $data = $request->validate([
            'periode_id' => ['required', 'exists:periode,id'],
            'group_size' => ['nullable', 'integer', 'min:10', 'max:20'],
        ]);

        if (! $this->isRegularPeriod((int) $data['periode_id'])) {
            return $this->error('PLOTTING_REGULER_ONLY', 'Plotting otomatis hanya untuk KKN Reguler. KKN non-Reguler menggunakan penempatan manual di Sibermas.', 422);
        }

        $lock = Cache::lock('auto-plotting:simulate:'.$data['periode_id'], 120);

        if (! $lock->get()) {
            return $this->error('PLOTTING_BUSY', 'Simulasi plotting periode ini sedang berjalan. Coba lagi beberapa menit.', 429);
        }

        try {
            $startedAt = microtime(true);
            $result = $service->simulate((int) $data['periode_id'], (int) ($data['group_size'] ?? 15));
            $result['mode'] = 'simulasi';
            $result['safe_note'] = 'Mode simulasi: tidak menulis/mengubah data real.';
            $result['elapsed_seconds'] = round(microtime(true) - $startedAt, 2);

            return $this->success($result);
        } finally {
            optional($lock)->release();
        }
    }

    public function apply(Request $request, AutoPlottingService $service): JsonResponse
    {
        if (auth()->user()?->hasRole('faculty_admin')) {
            return $this->error('FORBIDDEN', 'Admin fakultas tidak boleh menerapkan plotting.', 403);
        }

        $data = $request->validate([
            'periode_id' => ['required', 'exists:periode,id'],
            'group_size' => ['nullable', 'integer', 'min:10', 'max:20'],
            'confirm' => ['accepted'],
            'mode' => ['required', 'in:real'],
        ]);

        if (! $this->isRegularPeriod((int) $data['periode_id'])) {
            return $this->error('PLOTTING_REGULER_ONLY', 'Plotting otomatis hanya untuk KKN Reguler. KKN non-Reguler menggunakan penempatan manual di Sibermas.', 422);
        }

        $lock = Cache::lock('auto-plotting:apply:'.$data['periode_id'], 300);

        if (! $lock->get()) {
            return $this->error('PLOTTING_BUSY', 'Penerapan plotting periode ini sedang berjalan. Coba lagi beberapa menit.', 429);
        }

        try {
            $startedAt = microtime(true);
            $result = $service->apply((int) $data['periode_id'], (int) ($data['group_size'] ?? 15));
            $result['mode'] = 'real';
            $result['safe_note'] = 'Mode real: menulis kelompok dan update peserta_kkn.kelompok_id.';
            $result['elapsed_seconds'] = round(microtime(true) - $startedAt, 2);

            return $this->success($result);
        } finally {
            optional($lock)->release();
        }
    }
    private function isRegularPeriod(int $periodeId): bool
    {
        $periode = Periode::with('jenisKkn')->find($periodeId);
        $code = strtoupper((string) ($periode?->jenisKkn?->code ?? ''));
        $name = strtoupper((string) ($periode?->jenisKkn?->name ?? $periode?->name ?? ''));

        return str_contains($code, 'REGULER') || str_contains($name, 'REGULER');
    }
}
