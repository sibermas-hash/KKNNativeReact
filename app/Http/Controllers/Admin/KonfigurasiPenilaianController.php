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
        $configs = KonfigurasiPenilaian::all()->groupBy('group');

        return Inertia::render('Admin/Grading/Settings', [
            'configs' => $configs
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'configs' => 'required|array',
            'configs.*.id' => 'required|exists:konfigurasi_penilaian,id',
            'configs.*.percentage' => 'required|numeric|min:0|max:100',
        ]);

        foreach ($validated['configs'] as $configData) {
            KonfigurasiPenilaian::find($configData['id'])->update([
                'percentage' => $configData['percentage']
            ]);
        }

        Cache::forget('grading_configs');

        return back()->with('success', 'Konfigurasi penilaian berhasil diperbarui.');
    }
}
