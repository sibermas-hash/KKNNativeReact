<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\KonfigurasiSertifikat;
use App\Services\KKN\KonfigurasiSertifikatService;
use App\Services\PeriodContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CertificateConfigController extends Controller
{
    public function index(Request $request, KonfigurasiSertifikatService $service): Response
    {
        Gate::authorize('manage-settings');

        $periodContext = app(PeriodContextService::class);
        $periodId = $request->integer('period_id', $periodContext->getActivePeriodId() ?: 0);

        // Dapatkan kombinasi config (periode + global fallback)
        $configs = $service->getAllForPeriode($periodId);

        // Ubah array key-value kembali ke format array objek untuk frontend
        $formattedConfigs = collect($configs)->map(function ($value, $key) {
            $baseConfig = KonfigurasiSertifikat::global()->where('config_key', $key)->first();

            return [
                'id' => $baseConfig ? $baseConfig->id : null, // ID global untuk reference update
                'config_key' => $key,
                'label' => $baseConfig ? $baseConfig->label : ucwords(str_replace('_', ' ', $key)),
                'value' => $value,
                'type' => $baseConfig ? $baseConfig->type : 'text',
            ];
        })->values();

        return Inertia::render('Admin/System/Settings/Certificate', [
            'configs' => $formattedConfigs,
            'currentPeriodId' => $periodId,
            'isPeriodLocked' => $periodContext->getActivePeriod()?->is_locked ?? false,
        ]);
    }

    public function update(Request $request, KonfigurasiSertifikatService $service): RedirectResponse
    {
        Gate::authorize('manage-settings');

        $periodId = $request->integer('period_id', app(PeriodContextService::class)->getActivePeriodId() ?: 0);

        if (! $periodId) {
            return redirect()->back()->with('error', 'Silakan pilih periode terlebih dahulu.');
        }

        // Cek apakah periode yang dipilih sedang dikunci (jika bukan global config 0)
        if ($periodId > 0) {
            $period = \App\Models\KKN\Periode::find($periodId);
            if ($period?->is_locked) {
                return redirect()->back()->with('error', 'Kamar periode sedang dikunci. Perubahan konfigurasi diblokir.');
            }
        }

        $configs = $request->input('configs', []);
        $files = $request->file('configs', []);

        foreach ($configs as $index => $configData) {
            // Kita butuh config_key, frontend saat ini mengirim 'id'.
            $masterConfig = KonfigurasiSertifikat::global()->find($configData['id']);
            if (! $masterConfig) {
                continue;
            }

            $key = $masterConfig->config_key;
            $value = $configData['value'] ?? null;

            if (isset($files[$index]['value'])) {
                $file = $files[$index]['value'];
                $path = $file->store('certificates/assets/'.$periodId, 'public');
                $value = $path;
            }

            if ($value !== null) {
                $service->setForPeriode($key, (string) $value, $periodId);
            }
        }

        return redirect()->back()->with('success', 'Konfigurasi sertifikat berhasil diperbarui.');
    }
}
