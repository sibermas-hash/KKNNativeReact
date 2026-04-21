<?php

declare(strict_types=1);

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
            'configs' => $configs,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        Gate::authorize('manage-settings');

        // Laravel handles multipart/form-data for POST requests.
        // If we use PATCH, we'd need to spoof it, but here we'll just handle the request data.
        $configs = $request->input('configs', []);
        $files = $request->file('configs', []);

        foreach ($configs as $index => $configData) {
            $id = $configData['id'];
            $value = $configData['value'];

            // Check if there is an uploaded file for this config index
            if (isset($files[$index]['value'])) {
                $file = $files[$index]['value'];
                // Store the file in public/certificates/assets
                $path = $file->store('certificates/assets', 'public');
                $value = $path;
            }

            KonfigurasiSertifikat::where('id', $id)->update([
                'value' => $value,
            ]);
        }

        return redirect()->back()->with('success', 'Konfigurasi sertifikat berhasil diperbarui.');
    }
}
