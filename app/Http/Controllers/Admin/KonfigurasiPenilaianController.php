<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\KonfigurasiPenilaian;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class KonfigurasiPenilaianController extends Controller
{
    public function index()
    {
        KonfigurasiPenilaian::ensureDefaults();

        $configs = KonfigurasiPenilaian::query()
            ->orderByRaw("CASE \"group\" WHEN 'main' THEN 1 WHEN 'dpl' THEN 2 WHEN 'village' THEN 3 WHEN 'lppm' THEN 4 ELSE 5 END")
            ->orderBy('id')
            ->get();

        $sections = $configs
            ->groupBy('group')
            ->map(fn ($items, $group) => [
                'group' => $group,
                'title' => $this->groupTitle($group),
                'description' => $this->groupDescription($group),
                'enforce_total' => $group !== 'extras',
                'total' => round((float) $items->sum(fn ($item) => (float) $item->percentage), 2),
                'items' => $items->map(fn (KonfigurasiPenilaian $item) => [
                    'id' => $item->id,
                    'config_key' => $item->config_key,
                    'label' => $item->label,
                    'percentage' => (float) $item->percentage,
                    'description' => $item->description,
                ])->values(),
            ])
            ->values();

        return Inertia::render('Admin/Grading/Settings', [
            'sections' => $sections,
        ]);
    }

    public function update(Request $request)
    {
        KonfigurasiPenilaian::ensureDefaults();

        $validated = $request->validate([
            'configs' => 'required|array',
            'configs.*.id' => 'required|exists:kkn.konfigurasi_penilaian,id',
            'configs.*.percentage' => 'required|numeric|min:0|max:100',
        ]);

        $configs = collect($validated['configs']);

        $models = KonfigurasiPenilaian::query()
            ->whereIn('id', $configs->pluck('id'))
            ->get();

        $groupedTotals = $models
            ->mapWithKeys(function (KonfigurasiPenilaian $config) use ($configs) {
                $percentage = (float) $configs->firstWhere('id', $config->id)['percentage'];

                return [$config->config_key => [
                    'group' => $config->group,
                    'percentage' => $percentage,
                ]];
            })
            ->groupBy(fn ($entry) => $entry['group'])
            ->map(fn ($entries) => round((float) collect($entries)->sum('percentage'), 2));

        foreach (['main', 'dpl', 'village', 'lppm'] as $group) {
            if (($groupedTotals[$group] ?? 0.0) !== 100.0) {
                return back()->withErrors([
                    'configs' => "Total bobot untuk kelompok {$this->groupTitle($group)} harus tepat 100%.",
                ]);
            }
        }

        foreach ($validated['configs'] as $configData) {
            KonfigurasiPenilaian::find($configData['id'])->update([
                'percentage' => $configData['percentage'],
            ]);
        }

        Cache::forget('grading_configs');

        return back()->with('success', 'Konfigurasi penilaian berhasil diperbarui.');
    }

    private function groupTitle(string $group): string
    {
        return match ($group) {
            'main' => 'Bobot Nilai Akhir',
            'dpl' => 'Komponen DPL',
            'village' => 'Komponen Desa / Mitra',
            'lppm' => 'Komponen LPPM',
            'extras' => 'Pengaturan Tambahan',
            default => ucfirst($group),
        };
    }

    private function groupDescription(string $group): string
    {
        return match ($group) {
            'main' => 'Bobot utama yang menentukan kontribusi setiap komponen terhadap nilai akhir mahasiswa.',
            'dpl' => 'Rincian bobot penilaian yang berasal dari Dosen Pembimbing Lapangan.',
            'village' => 'Rincian bobot penilaian dari desa atau mitra lapangan.',
            'lppm' => 'Rincian bobot penilaian administratif dan workshop dari LPPM.',
            'extras' => 'Nilai default tambahan yang dipakai oleh modul penilaian terkait.',
            default => 'Konfigurasi penilaian.',
        };
    }
}
