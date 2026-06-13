<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\KonfigurasiSertifikat;
use App\Models\KKN\Periode;
use App\Models\KKN\SertifikatKkn;
use App\Services\CertificateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;

class CertificateManagementController extends Controller
{
    use ApiResponse;

    private const KEYS = [
        'cert_title' => ['Judul Sertifikat', 'text'],
        'cert_body' => ['Isi Sertifikat', 'textarea'],
        'cert_background' => ['Background Sertifikat', 'image'],
        'cert_signer_left_name' => ['Nama Penandatangan Kiri', 'text'],
        'cert_signer_left_title' => ['Jabatan Penandatangan Kiri', 'text'],
        'cert_signer_right_name' => ['Nama Penandatangan Kanan', 'text'],
        'cert_signer_right_title' => ['Jabatan Penandatangan Kanan', 'text'],
        'cert_signer_left_signature' => ['TTD Penandatangan Kiri', 'image'],
        'cert_signer_right_signature' => ['TTD Penandatangan Kanan', 'image'],
        'cert_stamp' => ['Stempel', 'image'],
        'cert_layout_json' => ['Layout Sertifikat (JSON)', 'textarea'],
    ];

    public function index(Request $request): JsonResponse
    {
        $periodeId = (int) $request->integer('periode_id');
        $periode = $periodeId > 0
            ? Periode::with('jenisKkn')->find($periodeId)
            : Periode::with('jenisKkn')->where('name', 'ilike', '%PAMMT%')->orWhere('name', 'ilike', '%MAGANG%FTIK%')->latest('id')->first();

        if (! $periode) {
            return $this->error('not_found', 'Periode sertifikat tidak ditemukan.', 404);
        }

        $configs = KonfigurasiSertifikat::where('periode_id', $periode->id)->get()->keyBy('config_key');
        $result = [];
        foreach (self::KEYS as $key => [$label, $type]) {
            $row = $configs->get($key);
            $result[] = ['config_key' => $key, 'label' => $row?->label ?? $label, 'value' => $row?->value ?? '', 'type' => $row?->type ?? $type];
        }

        $certQuery = SertifikatKkn::where('periode_id', $periode->id);

        return $this->success([
            'periode' => ['id' => $periode->id, 'name' => $periode->name, 'current_phase' => $periode->current_phase, 'jenis' => $periode->jenisKkn?->name],
            'stats' => ['total' => (clone $certQuery)->count(), 'active' => (clone $certQuery)->whereNull('revoked_at')->count(), 'revoked' => (clone $certQuery)->whereNotNull('revoked_at')->count(), 'with_token' => (clone $certQuery)->whereNotNull('verification_token')->count()],
            'configs' => $result,
            'sample' => (clone $certQuery)->orderBy('id')->first(['id', 'nama_mahasiswa', 'nim', 'certificate_number', 'verification_token']),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'periode_id' => ['required', 'integer', 'exists:periode,id'],
            'configs' => ['required', 'array'],
            'configs.*.config_key' => ['required', 'string', 'in:'.implode(',', array_keys(self::KEYS))],
            'configs.*.value' => ['nullable', 'string'],
        ]);
        $saved = [];
        foreach ($validated['configs'] as $item) {
            [$label, $type] = self::KEYS[$item['config_key']];
            $saved[] = KonfigurasiSertifikat::updateOrCreate(['periode_id' => $validated['periode_id'], 'config_key' => $item['config_key']], ['label' => $label, 'type' => $type, 'value' => $item['value'] ?? '']);
        }

        return $this->success(['configs' => $saved], 'Konfigurasi sertifikat tersimpan.');
    }

    public function uploadBackground(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'periode_id' => ['required', 'integer', 'exists:periode,id'],
            'key' => ['nullable', 'string', 'in:cert_background,cert_signer_left_signature,cert_signer_right_signature,cert_stamp'],
            'file' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);
        $key = $validated['key'] ?? 'cert_background';
        $path = $request->file('file')->store('certificate-assets', 'public');
        [$label, $type] = self::KEYS[$key];
        KonfigurasiSertifikat::updateOrCreate(['periode_id' => $validated['periode_id'], 'config_key' => $key], ['label' => $label, 'type' => $type, 'value' => $path]);

        return $this->success(['path' => $path, 'url' => Storage::disk('public')->url($path)], 'Asset sertifikat diunggah.');
    }

    public function preview(SertifikatKkn $sertifikat): Response|JsonResponse
    {
        if ($sertifikat->isRevoked()) {
            return $this->error('FORBIDDEN', 'Sertifikat telah dibatalkan.', 403);
        }

        return app(CertificateService::class)->generateForIssuedCertificate($sertifikat)->stream($this->safePdfName($sertifikat));
    }

    public function download(SertifikatKkn $sertifikat): Response|JsonResponse
    {
        if ($sertifikat->isRevoked()) {
            return $this->error('FORBIDDEN', 'Sertifikat telah dibatalkan.', 403);
        }

        return app(CertificateService::class)->generateForIssuedCertificate($sertifikat)->download($this->safePdfName($sertifikat));
    }

    public function zip(Request $request): BinaryFileResponse|JsonResponse
    {
        $validated = $request->validate(['periode_id' => ['required', 'integer', 'exists:periode,id']]);
        $certificates = SertifikatKkn::where('periode_id', $validated['periode_id'])->whereNull('revoked_at')->orderBy('nim')->get();
        if ($certificates->isEmpty()) {
            return $this->error('not_found', 'Belum ada sertifikat aktif untuk periode ini.', 404);
        }
        $dir = storage_path('app/tmp');
        if (! is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        $zipPath = $dir.'/sertifikat-periode-'.$validated['periode_id'].'-'.now()->format('Ymd-His').'.zip';
        $zip = new \ZipArchive;
        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            return $this->error('SERVER_ERROR', 'Gagal membuat ZIP sertifikat.', 500);
        }
        $ok = 0;
        foreach ($certificates as $cert) {
            try {
                $zip->addFromString($this->safePdfName($cert), app(CertificateService::class)->generateForIssuedCertificate($cert)->output());
                $ok++;
            } catch (\Throwable) {
            }
        }
        $zip->close();
        if ($ok === 0) {
            @unlink($zipPath);

            return $this->error('SERVER_ERROR', 'Tidak ada sertifikat yang berhasil digenerate.', 500);
        }

        return response()->download($zipPath, 'Sertifikat_Periode_'.$validated['periode_id'].'.zip')->deleteFileAfterSend(true);
    }

    public function regenerate(Request $request): JsonResponse
    {
        $validated = $request->validate(['periode_id' => ['required', 'integer', 'exists:periode,id'], 'force' => ['nullable', 'boolean']]);
        $force = (bool) ($validated['force'] ?? false);
        $certificates = SertifikatKkn::where('periode_id', $validated['periode_id'])->whereNull('revoked_at')->orderBy('id')->get();
        $updated = 0;
        foreach ($certificates as $cert) {
            $token = $cert->verification_token;
            if ($force || ! $token) {
                $token = CertificateService::generateIssuedCertificateToken($cert);
            }
            $number = $cert->certificate_number;
            if ($force || ! $number) {
                $number = 'KKN/'.$cert->periode_id.'/'.$token;
            }
            if ($token !== $cert->verification_token || $number !== $cert->certificate_number || ! $cert->issued_at) {
                $cert->forceFill(['verification_token' => $token, 'certificate_number' => $number, 'issued_at' => $cert->issued_at ?: now(), 'issued_by' => auth()->id()])->save();
                $updated++;
            }
        }

        return $this->success(['total' => $certificates->count(), 'updated' => $updated, 'force' => $force], $force ? 'Nomor/token sertifikat digenerate ulang.' : 'Nomor/token kosong dilengkapi.');
    }

    private function safePdfName(SertifikatKkn $sertifikat): string
    {
        $nim = $sertifikat->nim ?: (string) $sertifikat->id;
        $name = Str::slug($sertifikat->nama_mahasiswa ?: 'sertifikat', '_');

        return preg_replace('/[^A-Za-z0-9_\-\.]/', '_', "Sertifikat_{$nim}_{$name}.pdf") ?: 'Sertifikat.pdf';
    }
}
