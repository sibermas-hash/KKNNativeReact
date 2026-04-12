<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StoreDailyReportRequest;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\FileKegiatanKkn;
use App\Models\KKN\SystemSetting;
use App\Services\PeriodContextService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class DailyReportController extends Controller
{
    /**
     * Validate file magic bytes to prevent MIME spoofing.
     */
    private function validateFileMagicBytes($file): void
    {
        if ($file->getSize() < 4) {
            abort(422, 'File terlalu kecil untuk divalidasi.');
        }

        $allowedSignatures = [
            'pdf' => [0x25, 0x50, 0x44], // %PD
            'png' => [0x89, 0x50, 0x4E, 0x47], // PNG
            'jpg' => [0xFF, 0xD8, 0xFF], // JPEG
        ];

        try {
            $stream = fopen($file->getRealPath(), 'rb');
            if (!$stream) {
                abort(422, 'Gagal membuka file.');
            }
            $bytes = array_values(unpack('C4', fread($stream, 4)));
            fclose($stream);

            $valid = false;
            foreach ($allowedSignatures as $signature) {
                if (count($bytes) >= count($signature)) {
                    if (array_slice($bytes, 0, count($signature)) === array_values($signature)) {
                        $valid = true;
                        break;
                    }
                }
            }

            abort_if(!$valid, 422, 'Format file tidak valid atau tidak sesuai dengan type yang didekladasikan.');
        } catch (\Exception $e) {
            abort(422, 'Gagal memvalidasi file.');
        }
    }
    public function index(): Response
    {
        $periodContextService = app(PeriodContextService::class);
        $activePeriodId = $periodContextService->getActivePeriodId() ?? $periodContextService->getDefaultPeriodId();
        $mahasiswa = auth()->user()?->mahasiswa;

        $kegiatan = $mahasiswa
            ? KegiatanKkn::where('mahasiswa_id', $mahasiswa->id)
                ->with(['kelompok', 'fileKegiatan'])
                ->orderByDesc('date')
                ->paginate(10)
            : collect();

        return Inertia::render('Student/DailyReports/Index', [
            'reports' => $kegiatan,
        ]);
    }

    public function create(): Response
    {
        $mahasiswa = auth()->user()?->mahasiswa;
        $pendaftaran = $mahasiswa?->peserta()->where('status', 'approved')->with(['kelompok.lokasi', 'kelompok.posko'])->first();
        
        abort_if(!$pendaftaran, 403, 'Anda belum terdaftar dalam kelompok aktif.');

        return Inertia::render('Student/DailyReports/Create', [
            'group' => [
                'id' => $pendaftaran->kelompok->id,
                'nama_kelompok' => $pendaftaran->kelompok->nama_kelompok,
                'name' => $pendaftaran->kelompok->nama_kelompok,
            ],
            'geoPolicy' => $this->buildGeoPolicy($pendaftaran->kelompok),
        ]);
    }

    public function store(StoreDailyReportRequest $request): RedirectResponse|JsonResponse
    {
        $mahasiswa = auth()->user()?->mahasiswa;
        abort_if(!$mahasiswa, 403, 'Profil mahasiswa tidak ditemukan.');
        
        $pendaftaran = $mahasiswa->peserta()->where('status', 'approved')->with(['kelompok.lokasi', 'kelompok.posko'])->first();
        abort_if(!$pendaftaran || !$pendaftaran->kelompok_id, 403, 'Anda belum ditempatkan di kelompok.');

        $validated = $request->validated();

        // 24 HOURS BACKDATE PROTECTION
        $reportDate = Carbon::parse($validated['date']);
        if ($reportDate->diffInHours(now()) > 24 && !auth()->user()->hasRole('superadmin')) {
            throw ValidationException::withMessages([
                'date' => 'Maaf, logbook maksimal diisi 24 jam setelah kegiatan berlangsung (SOP LPPM UIN SAIZU).',
            ]);
        }

        $this->enforceGpsPolicy($validated, $pendaftaran->kelompok);

        $kegiatan = KegiatanKkn::create([
            'mahasiswa_id' => $mahasiswa->id,
            'kelompok_id' => $pendaftaran->kelompok_id,
            'date' => $validated['date'],
            'category' => $validated['category'],
            'title' => $validated['title'],
            'abcd_stage' => $validated['abcd_stage'],
            'activity' => $validated['activity'],
            'reflection' => $validated['reflection'] ?? null,
            'social_media_link' => $validated['social_media_link'] ?? null,
            'output' => $validated['output'] ?? null,
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'gps_accuracy' => $validated['gps_accuracy'] ?? null,
            'captured_at' => Carbon::parse($validated['captured_at']),
            'location_source' => 'gps',
            'location_name' => $validated['location_name'] ?? null,
            'status' => 'submitted',
        ]);

        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $this->validateFileMagicBytes($file);

                $originalName = $file->getClientOriginalName();
                $extension = strtolower($file->getClientOriginalExtension());
                $safeFilename = Str::uuid() . '.' . $extension;

                $path = $file->storeAs('daily-reports', $safeFilename, 'local');
                
                if (in_array($extension, ['jpg', 'jpeg', 'png', 'webp'])) {
                    app(\App\Services\PhotoWatermarkService::class)->apply($path, [
                        'nim' => $mahasiswa->nim,
                        'captured_at' => $validated['captured_at'],
                        'latitude' => $validated['latitude'],
                        'longitude' => $validated['longitude'],
                    ]);
                }

                FileKegiatanKkn::create([
                    'kegiatan_kkn_id' => $kegiatan->id,
                    'file_path' => $path,
                    'file_name' => Str::limit($originalName, 255),
                ]);
            }
        }

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Laporan harian berhasil dikirim.',
                'report_id' => $kegiatan->id,
            ], 201);
        }

        return redirect()->route('student.laporan-harian.index')
            ->with('success', 'Laporan harian berhasil dikirim.');
    }

    public function edit(KegiatanKkn $dailyReport): Response
    {
        \Illuminate\Support\Facades\Gate::authorize('view', $dailyReport);
        $dailyReport->load(['fileKegiatan', 'kelompok.lokasi', 'kelompok.posko']);

        return Inertia::render('Student/DailyReports/Edit', [
            'report' => $dailyReport,
            'geoPolicy' => $this->buildGeoPolicy($dailyReport->kelompok),
        ]);
    }

    public function update(StoreDailyReportRequest $request, KegiatanKkn $dailyReport): RedirectResponse|JsonResponse
    {
        \Illuminate\Support\Facades\Gate::authorize('update', $dailyReport);
        $dailyReport->loadMissing(['kelompok.lokasi', 'kelompok.posko']);

        $validated = $request->validated();
        $this->enforceGpsPolicy($validated, $dailyReport->kelompok);

        $dailyReport->update([
            'date' => $validated['date'],
            'title' => $validated['title'],
            'abcd_stage' => $validated['abcd_stage'],
            'activity' => $validated['activity'],
            'reflection' => $validated['reflection'] ?? null,
            'social_media_link' => $validated['social_media_link'] ?? null,
            'output' => $validated['output'] ?? null,
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'gps_accuracy' => $validated['gps_accuracy'] ?? null,
            'captured_at' => Carbon::parse($validated['captured_at']),
            'location_source' => 'gps',
            'location_name' => $validated['location_name'] ?? null,
            'status' => 'submitted',
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Laporan harian berhasil diperbarui.',
                'report_id' => $dailyReport->id,
            ]);
        }

        return redirect()->route('student.laporan-harian.index')
            ->with('success', 'Laporan harian berhasil diperbarui.');
    }

    public function destroy(KegiatanKkn $dailyReport): RedirectResponse
    {
        \Illuminate\Support\Facades\Gate::authorize('delete', $dailyReport);
        
        foreach ($dailyReport->fileKegiatan as $file) {
            Storage::disk('local')->delete($file->file_path);
        }

        $dailyReport->delete();

        return redirect()->route('student.laporan-harian.index')
            ->with('success', 'Laporan harian berhasil dihapus.');
    }

    private function buildGeoPolicy(KelompokKkn $group): array
    {
        $radiusMeters = (int) SystemSetting::get('daily_report_geo_radius_meters', '5000');
        $maxAccuracyMeters = (int) SystemSetting::get('daily_report_geo_max_accuracy_meters', '250');

        $reference = null;

        if ($group->posko?->latitude !== null && $group->posko?->longitude !== null) {
            $reference = [
                'label' => 'Posko Kelompok',
                'latitude' => (float) $group->posko->latitude,
                'longitude' => (float) $group->posko->longitude,
            ];
        } elseif ($group->lokasi?->latitude !== null && $group->lokasi?->longitude !== null) {
            $reference = [
                'label' => $group->lokasi->full_name ?: $group->lokasi->village_name ?: 'Lokasi KKN',
                'latitude' => (float) $group->lokasi->latitude,
                'longitude' => (float) $group->lokasi->longitude,
            ];
        }

        return [
            'requires_gps' => true,
            'offline_sync_enabled' => true,
            'radius_meters' => $radiusMeters,
            'max_accuracy_meters' => $maxAccuracyMeters,
            'reference' => $reference,
        ];
    }

    private function enforceGpsPolicy(array $validated, KelompokKkn $group): void
    {
        $policy = $this->buildGeoPolicy($group);
        $accuracy = isset($validated['gps_accuracy']) ? (float) $validated['gps_accuracy'] : null;

        if ($accuracy !== null && $policy['max_accuracy_meters'] > 0 && $accuracy > $policy['max_accuracy_meters']) {
            throw ValidationException::withMessages([
                'gps_accuracy' => "Akurasi GPS terlalu lemah ({$accuracy} m). Coba ambil lokasi lagi di area yang lebih terbuka.",
            ]);
        }

        if (! $policy['reference']) {
            return;
        }

        $distance = $this->calculateDistanceMeters(
            (float) $validated['latitude'],
            (float) $validated['longitude'],
            $policy['reference']['latitude'],
            $policy['reference']['longitude'],
        );

        if ($distance > $policy['radius_meters']) {
            throw ValidationException::withMessages([
                'latitude' => "Lokasi GPS berada di luar radius yang diizinkan (" . round($distance) . " meter dari {$policy['reference']['label']}).",
            ]);
        }
    }

    private function calculateDistanceMeters(float $latitude, float $longitude, float $referenceLatitude, float $referenceLongitude): float
    {
        $earthRadius = 6371000;

        $latitudeDelta = deg2rad($referenceLatitude - $latitude);
        $longitudeDelta = deg2rad($referenceLongitude - $longitude);

        $a = sin($latitudeDelta / 2) ** 2
            + cos(deg2rad($latitude)) * cos(deg2rad($referenceLatitude)) * sin($longitudeDelta / 2) ** 2;

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
