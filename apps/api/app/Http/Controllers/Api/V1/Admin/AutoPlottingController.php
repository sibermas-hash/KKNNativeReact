<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Services\KKN\AutoPlottingService;
use App\Services\KKN\ExternalKebumenPlottingService;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AutoPlottingController extends Controller
{
    use ApiResponse;

    public function simulate(Request $request, AutoPlottingService $service): JsonResponse
    {
        $data = $request->validate([
            'periode_id' => ['nullable', 'exists:periode,id'],
            'group_size' => ['nullable', 'integer', 'min:10', 'max:20'],
        ]);

        $periodeId = $this->resolveRegularActivePeriodId($data['periode_id'] ?? null);
        if (! $periodeId) {
            return $this->error('PLOTTING_REGULER_ONLY', 'Plotting otomatis hanya untuk KKN Reguler aktif. KKN non-Reguler menggunakan penempatan manual di Sibermas.', 422);
        }

        $lock = Cache::lock('auto-plotting:simulate:'.$periodeId, 120);

        if (! $lock->get()) {
            return $this->error('PLOTTING_BUSY', 'Simulasi plotting periode ini sedang berjalan. Coba lagi beberapa menit.', 429);
        }

        try {
            $startedAt = microtime(true);
            $result = $service->simulate($periodeId, (int) ($data['group_size'] ?? 15));
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
            'periode_id' => ['nullable', 'exists:periode,id'],
            'group_size' => ['nullable', 'integer', 'min:10', 'max:20'],
            'confirm' => ['accepted'],
            'mode' => ['required', 'in:real'],
        ]);

        $periodeId = $this->resolveRegularActivePeriodId($data['periode_id'] ?? null);
        if (! $periodeId) {
            return $this->error('PLOTTING_REGULER_ONLY', 'Plotting otomatis hanya untuk KKN Reguler aktif. KKN non-Reguler menggunakan penempatan manual di Sibermas.', 422);
        }

        $lock = Cache::lock('auto-plotting:apply:'.$periodeId, 300);

        if (! $lock->get()) {
            return $this->error('PLOTTING_BUSY', 'Penerapan plotting periode ini sedang berjalan. Coba lagi beberapa menit.', 429);
        }

        try {
            $startedAt = microtime(true);
            $result = $service->apply($periodeId, (int) ($data['group_size'] ?? 15));
            $result['mode'] = 'simulation_saved';
            $result['safe_note'] = 'Mode simulasi tersimpan: kelompok_id diisi sebagai draft, tetapi dashboard mahasiswa tetap menyembunyikan hasil sampai Super Admin publish Plotting Live/Real.';
            $result['elapsed_seconds'] = round(microtime(true) - $startedAt, 2);

            return $this->success($result);
        } finally {
            optional($lock)->release();
        }
    }

    public function publish(Request $request): JsonResponse
    {
        if (! auth()->user()?->hasRole('superadmin')) {
            return $this->error('FORBIDDEN', 'Hanya Super Admin yang boleh publish Plotting Live/Real.', 403);
        }

        $data = $request->validate([
            'periode_id' => ['nullable', 'exists:periode,id'],
            'confirm' => ['accepted'],
        ]);

        $periodeId = $this->resolveRegularActivePeriodId($data['periode_id'] ?? null);
        if (! $periodeId) {
            return $this->error('PLOTTING_REGULER_ONLY', 'Plotting Live/Real otomatis hanya untuk KKN Reguler aktif. KKN non-Reguler memakai publish manual terpisah.', 422);
        }

        $updated = PesertaKkn::query()
            ->where('periode_id', $periodeId)
            ->where('status', 'approved')
            ->whereNotNull('kelompok_id')
            ->update([
                'placement_is_live' => true,
                'placement_published_at' => now(),
                'placement_published_by' => auth()->id(),
            ]);

        return $this->success([
            'periode_id' => $periodeId,
            'published_count' => $updated,
            'mode' => 'live',
        ], 'Plotting Live/Real dipublish. Dashboard mahasiswa sekarang menampilkan kelompok live.');
    }

    public function externalKebumenPreview(Request $request, ExternalKebumenPlottingService $service): JsonResponse
    {
        $data = $request->validate([
            'periode_id' => ['nullable', 'exists:periode,id'],
        ]);

        return $this->success($service->preview(isset($data['periode_id']) ? (int) $data['periode_id'] : null));
    }

    public function externalKebumenApply(Request $request, ExternalKebumenPlottingService $service): JsonResponse
    {
        if (auth()->user()?->hasRole('faculty_admin')) {
            return $this->error('FORBIDDEN', 'Admin fakultas tidak boleh menerapkan plotting.', 403);
        }

        $data = $request->validate([
            'periode_id' => ['nullable', 'exists:periode,id'],
            'confirm' => ['accepted'],
        ]);

        return $this->success($service->apply(isset($data['periode_id']) ? (int) $data['periode_id'] : null));
    }

    private function resolveRegularActivePeriodId(null|int|string $periodeId): ?int
    {
        $query = Periode::with('jenisKkn')->where('is_active', true);

        if ($periodeId) {
            $query->whereKey((int) $periodeId);
        }

        $periode = $query
            ->get()
            ->first(fn (Periode $periode): bool => $this->isRegularPeriodModel($periode));

        return $periode?->id;
    }

    private function isRegularPeriodModel(Periode $periode): bool
    {
        $code = strtoupper((string) ($periode->jenisKkn?->code ?? ''));
        $name = strtoupper((string) ($periode->jenisKkn?->name ?? $periode->name ?? ''));

        return str_contains($code, 'REGULER') || str_contains($name, 'REGULER');
    }
}
