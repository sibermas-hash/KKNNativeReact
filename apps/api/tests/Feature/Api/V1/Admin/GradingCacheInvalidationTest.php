<?php

declare(strict_types=1);

use App\Enums\KknType;
use App\Models\KKN\KonfigurasiPenilaian;
use Illuminate\Support\Facades\Cache;

/**
 * Regression test untuk R11-FULL-023:
 * Cache `grading_configs_{kkn_type}` harus di-invalidate saat admin update
 * bobot di KonfigurasiPenilaianController.
 */

beforeEach(function () {
    $this->admin = createUserWithRole('superadmin');
    KonfigurasiPenilaian::ensureDefaults();
});

it('invalidates grading_configs cache when saving KonfigurasiPenilaian model', function () {
    $cacheKey = 'grading_configs_'.KknType::REGULER->value;

    // Prime cache dengan value lama
    Cache::put($cacheKey, ['weight_dpl_report' => 30], 3600);
    expect(Cache::has($cacheKey))->toBeTrue();

    // Update model — booted saved() harus invalidate cache
    $config = KonfigurasiPenilaian::where('kkn_type', KknType::REGULER)
        ->where('config_key', 'weight_dpl_report')
        ->first();
    $config->update(['percentage' => 35]);

    expect(Cache::has($cacheKey))->toBeFalse();
});

it('invalidates all kkn_type caches when controller bulk updates', function () {
    // Prime cache semua KknType
    foreach (KknType::cases() as $type) {
        Cache::put('grading_configs_'.$type->value, ['foo' => 'bar'], 3600);
    }

    $configs = KonfigurasiPenilaian::where('kkn_type', KknType::REGULER)->take(2)->get();

    $response = $this->actingAs($this->admin)
        ->patchJson('/api/v1/admin/konfigurasi-penilaian', [
            'configs' => $configs->map(fn ($c) => [
                'id' => $c->id,
                'percentage' => 25,
            ])->all(),
        ]);

    $response->assertOk();

    // Semua KknType cache harus di-forget (belt-and-suspenders di controller)
    foreach (KknType::cases() as $type) {
        expect(Cache::has('grading_configs_'.$type->value))
            ->toBeFalse("Cache untuk {$type->value} harusnya invalid setelah update");
    }
});

it('invalidates cache when deleted', function () {
    $cacheKey = 'grading_configs_'.KknType::REGULER->value;
    Cache::put($cacheKey, ['any' => 'value'], 3600);

    $config = KonfigurasiPenilaian::create([
        'kkn_type' => KknType::REGULER,
        'config_key' => 'test_delete_invalidate',
        'label' => 'Test',
        'percentage' => 10,
        'group' => 'extras',
    ]);

    // Saved event already invalidated; re-prime for delete check
    Cache::put($cacheKey, ['any' => 'value'], 3600);
    expect(Cache::has($cacheKey))->toBeTrue();

    $config->delete();

    expect(Cache::has($cacheKey))->toBeFalse();
});
