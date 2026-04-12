<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\KonfigurasiSertifikat;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CertificateConfigController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('manage-settings');
        $configs = KonfigurasiSertifikat::orderBy('id')->get();
        return Inertia::render('Admin/System/Settings/Certificate', [
            'configs' => $configs
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        Gate::authorize('manage-settings');
        $validated = $request->validate([
            'configs' => ['required', 'array'],
            'configs.*.id' => ['required', 'exists:kkn.konfigurasi_sertifikat,id'],
            'configs.*.value' => ['nullable', 'string']
        ]);

        foreach ($validated['configs'] as $configData) {
            KonfigurasiSertifikat::where('id', $configData['id'])->update([
                'value' => $configData['value']
            ]);
        }

        return redirect()->back()->with('success', 'Konfigurasi sertifikat berhasil diperbarui.');
    }
}