<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\KknType;
use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\KonfigurasiPenilaian;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class KonfigurasiPenilaianController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        KonfigurasiPenilaian::ensureDefaults();

        $selectedType = KknType::tryFrom((string) $request->input('kkn_type', '')) ?? KknType::REGULER;

        $configs = KonfigurasiPenilaian::where('kkn_type', $selectedType)
            ->orderByRaw("CASE \"group\" WHEN 'main' THEN 1 WHEN 'dpl' THEN 2 WHEN 'village' THEN 3 WHEN 'lppm' THEN 4 ELSE 5 END")
            ->orderBy('id')
            ->get();

        $sections = $configs->groupBy('group')->map(fn ($items, $group) => [
            'group' => $group,
            'enforce_total' => $group !== 'extras',
            'total' => round((float) $items->sum(fn ($i) => (float) $i->percentage), 2),
            'items' => $items->map(fn ($item) => [
                'id' => $item->id,
                'config_key' => $item->config_key,
                'label' => $item->label,
                'percentage' => (float) $item->percentage,
                'description' => $item->description,
            ])->values(),
        ])->values();

        return $this->success([
            'sections' => $sections,
            'program_options' => collect(KknType::cases())->map(fn ($t) => ['value' => $t->value, 'label' => $t->label()])->values(),
            'filters' => ['kkn_type' => $selectedType->value],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'configs' => ['required', 'array'],
            'configs.*.id' => ['required', 'exists:konfigurasi_penilaian,id'],
            'configs.*.percentage' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $configs = collect($validated['configs']);
        $models = KonfigurasiPenilaian::whereIn('id', $configs->pluck('id'))->get();

        foreach ($models as $model) {
            $percentage = (float) $configs->firstWhere('id', $model->id)['percentage'];
            $model->update(['percentage' => $percentage]);
        }

        // R11-FULL-023 fix: belt-and-suspenders cache invalidation.
        // Model event `saved()` di KonfigurasiPenilaian sudah invalidate cache
        // per-row, tapi kita explicit forget semua KknType cache di sini untuk
        // memastikan tidak ada stale weight saat bulk update. Redis cache TTL
        // 3600s — tanpa ini, perubahan bobot baru efektif setelah cache expire
        // (bisa 1 jam grading dengan bobot lama).
        foreach (KknType::cases() as $type) {
            Cache::forget('grading_configs_'.$type->value);
        }

        return $this->success(null, 'Konfigurasi penilaian berhasil diperbarui.');
    }
}
