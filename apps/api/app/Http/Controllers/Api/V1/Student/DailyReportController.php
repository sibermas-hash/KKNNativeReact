<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Helpers\QueryHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StoreDailyReportRequest;
use App\Http\Resources\Api\V1\KegiatanKknResource;
use App\Http\Traits\ApiResponse;
use App\Jobs\ApplyPhotoWatermarkJob;
use App\Models\KKN\FileKegiatanKkn;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\SystemSetting;
use App\Services\GeofenceService;
use App\Services\KKN\GpsAntiSpoofService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class DailyReportController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly GeofenceService $geofenceService,
        private readonly GpsAntiSpoofService $gpsAntiSpoof,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $mahasiswa = auth()->user()?->mahasiswa;

        if (! $mahasiswa) {
            return $this->forbidden('Profil mahasiswa tidak ditemukan.');
        }

        $reports = KegiatanKkn::where('mahasiswa_id', $mahasiswa->id)
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->input('search'), fn ($q, $s) => $q->where(function ($q) use ($s) {
                // R13-SEC-007: escape LIKE wildcards (%, _) to prevent pattern injection
                $safe = QueryHelper::escapeLike($s);
                $q->where('title', 'like', "%{$safe}%")->orWhere('activity', 'like', "%{$safe}%");
            }))
            ->with(['kelompok', 'fileKegiatan'])
            ->orderByDesc('date')
            ->paginate($request->input('per_page', 10));

        return $this->successCollection(
            KegiatanKknResource::collection($reports)
        );
    }

    public function show(KegiatanKkn $dailyReport): JsonResponse
    {
        Gate::authorize('view', $dailyReport);
        $dailyReport->load(['fileKegiatan', 'kelompok.lokasi', 'kelompok.posko']);

        return $this->success(new KegiatanKknResource($dailyReport));
    }

    public function store(StoreDailyReportRequest $request): JsonResponse
    {
        $mahasiswa = auth()->user()?->mahasiswa;
        abort_if(! $mahasiswa, 403, 'Profil mahasiswa tidak ditemukan.');

        $pendaftaran = $mahasiswa->peserta()->where('status', 'approved')->with(['kelompok.lokasi', 'kelompok.posko'])->latest('created_at')->first();
        abort_if(! $pendaftaran || ! $pendaftaran->kelompok_id, 403, 'Anda belum ditempatkan di kelompok.');

        $validated = $request->validated();

        // P1-A: 1 laporan per hari per mahasiswa.
        // Prevent dobel report di tanggal sama (sebelumnya tak ada constraint).
        $reportDate = Carbon::parse($validated['date'])->toDateString();
        $exists = KegiatanKkn::where('mahasiswa_id', $mahasiswa->id)
            ->whereDate('date', $reportDate)
            ->exists();
        if ($exists) {
            throw ValidationException::withMessages([
                'date' => 'Anda sudah membuat laporan untuk tanggal ini. Edit laporan yang ada jika perlu memperbarui.',
            ]);
        }

        // 24-hour backdate protection
        $reportDateCarbon = Carbon::parse($validated['date']);
        if ($reportDateCarbon->diffInHours(now()) > 24 && ! auth()->user()->hasRole('superadmin')) {
            throw ValidationException::withMessages([
                'date' => 'Logbook maksimal diisi 24 jam setelah kegiatan berlangsung.',
            ]);
        }

        $this->enforceGpsPolicy($validated, $pendaftaran->kelompok);
        $spoofResult = $this->runAntiSpoof($validated, $mahasiswa->id);

        $kegiatan = KegiatanKkn::create([
            'mahasiswa_id' => $mahasiswa->id,
            'kelompok_id' => $pendaftaran->kelompok_id,
            'date' => $validated['date'],
            'category' => $validated['category'] ?? null,
            'title' => strip_tags($validated['title']),
            'abcd_stage' => $validated['abcd_stage'] ?? null,
            'activity' => strip_tags($validated['activity']),
            'reflection' => isset($validated['reflection']) ? strip_tags($validated['reflection']) : null,
            'social_media_link' => $validated['social_media_link'] ?? null,
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'gps_accuracy' => $validated['gps_accuracy'] ?? null,
            'gps_is_mock' => $validated['is_mock_location'] ?? null,
            'gps_spoof_score' => $spoofResult['score'],
            'gps_spoof_details' => $spoofResult['suspicions'],
            'captured_at' => Carbon::parse($validated['captured_at']),
            'location_source' => 'gps',
            'location_name' => $validated['location_name'] ?? null,
            'status' => $spoofResult['action'] === GpsAntiSpoofService::ACTION_FLAG
                ? KegiatanKkn::STATUS_REVISION
                : KegiatanKkn::STATUS_SUBMITTED,
            'review_notes' => $spoofResult['action'] === GpsAntiSpoofService::ACTION_FLAG
                ? $this->buildSpoofReviewNote($spoofResult)
                : null,
        ]);

        if ($request->hasFile('files')) {
            $this->handleFileUploads($request, $kegiatan, $mahasiswa->nim, $validated);
        }

        $kegiatan->load('fileKegiatan');

        return $this->created(
            new KegiatanKknResource($kegiatan),
            'Laporan harian berhasil dikirim.'
        );
    }

    public function update(StoreDailyReportRequest $request, KegiatanKkn $dailyReport): JsonResponse
    {
        Gate::authorize('update', $dailyReport);
        $dailyReport->loadMissing(['kelompok.lokasi', 'kelompok.posko']);
        $wasRevision = $dailyReport->isRevisionRequested();

        $validated = $request->validated();

        // 24-hour backdate protection (same as store)
        $reportDate = Carbon::parse($validated['date']);
        if ($reportDate->diffInHours(now()) > 24 && ! auth()->user()->hasRole('superadmin')) {
            throw ValidationException::withMessages([
                'date' => 'Logbook maksimal diisi 24 jam setelah kegiatan berlangsung.',
            ]);
        }

        $this->enforceGpsPolicy($validated, $dailyReport->kelompok);
        $spoofResult = $this->runAntiSpoof($validated, $dailyReport->mahasiswa_id);

        $dailyReport->update([
            'date' => $validated['date'],
            'category' => $validated['category'] ?? null,
            'title' => strip_tags($validated['title']),
            'abcd_stage' => $validated['abcd_stage'] ?? null,
            'activity' => strip_tags($validated['activity']),
            'reflection' => isset($validated['reflection']) ? strip_tags($validated['reflection']) : null,
            'social_media_link' => $validated['social_media_link'] ?? null,
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'gps_accuracy' => $validated['gps_accuracy'] ?? null,
            'gps_is_mock' => $validated['is_mock_location'] ?? null,
            'gps_spoof_score' => $spoofResult['score'],
            'gps_spoof_details' => $spoofResult['suspicions'],
            'captured_at' => Carbon::parse($validated['captured_at']),
            'location_source' => 'gps',
            'location_name' => $validated['location_name'] ?? null,
            'status' => $spoofResult['action'] === GpsAntiSpoofService::ACTION_FLAG
                ? KegiatanKkn::STATUS_REVISION
                : KegiatanKkn::STATUS_SUBMITTED,
            'review_notes' => $spoofResult['action'] === GpsAntiSpoofService::ACTION_FLAG
                ? $this->buildSpoofReviewNote($spoofResult)
                : null,
            'reviewed_by' => null,
            'reviewed_at' => null,
        ]);

        $dailyReport->refresh()->load('fileKegiatan');

        return $this->success(
            new KegiatanKknResource($dailyReport),
            $wasRevision ? 'Laporan harian berhasil dikirim ulang.' : 'Laporan harian berhasil diperbarui.'
        );
    }

    public function destroy(KegiatanKkn $dailyReport): JsonResponse
    {
        Gate::authorize('delete', $dailyReport);

        $disk = Storage::disk(config('filesystems.default'));
        foreach ($dailyReport->fileKegiatan as $file) {
            $disk->delete($file->file_path);
        }

        $dailyReport->delete();

        return $this->noContent('Laporan harian berhasil dihapus.');
    }

    private function handleFileUploads(Request $request, KegiatanKkn $kegiatan, string $nim, array $validated): void
    {
        $diskName = config('filesystems.default');
        $disk = Storage::disk($diskName);

        foreach ($request->file('files') as $file) {
            $extension = strtolower($file->getClientOriginalExtension());
            $safeFilename = Str::uuid().'.'.$extension;
            $path = $file->storeAs('daily-reports', $safeFilename, $diskName);

            if (in_array($extension, ['jpg', 'jpeg', 'png', 'webp'])) {
                // R11-FULL-017 fix: watermark dijalankan async via queue
                // untuk menghindari blocking HTTP response (foto besar bisa
                // 3-5 detik render). Kalau queue belum setup (sync driver),
                // behavior sama dengan sync lama.
                ApplyPhotoWatermarkJob::dispatch($path, [
                    'nim' => $nim,
                    'captured_at' => (string) $validated['captured_at'],
                    'latitude' => (float) $validated['latitude'],
                    'longitude' => (float) $validated['longitude'],
                ]);
            }

            FileKegiatanKkn::create([
                'kegiatan_kkn_id' => $kegiatan->id,
                'file_path' => $path,
                'file_name' => Str::limit($file->getClientOriginalName(), 255),
            ]);
        }
    }

    private function enforceGpsPolicy(array $validated, $group): void
    {
        $radiusMeters = (int) SystemSetting::get('daily_report_geo_radius_meters', '5000');
        $maxAccuracy = (int) SystemSetting::get('daily_report_geo_max_accuracy_meters', '250');
        $isSuperadmin = auth()->user()->hasRole('superadmin');

        $reference = null;
        if ($group->posko?->latitude !== null && $group->posko?->longitude !== null) {
            $reference = ['lat' => (float) $group->posko->latitude, 'lng' => (float) $group->posko->longitude];
        } elseif ($group->lokasi?->latitude !== null && $group->lokasi?->longitude !== null) {
            $reference = ['lat' => (float) $group->lokasi->latitude, 'lng' => (float) $group->lokasi->longitude];
        }

        $accuracy = isset($validated['gps_accuracy']) ? (float) $validated['gps_accuracy'] : null;
        if ($accuracy !== null && $maxAccuracy > 0 && $accuracy > $maxAccuracy && ! $isSuperadmin) {
            throw ValidationException::withMessages([
                'gps_accuracy' => "Akurasi GPS terlalu lemah ({$accuracy} m).",
            ]);
        }

        if ($reference) {
            $distance = $this->geofenceService->calculateDistanceMeters(
                (float) $validated['latitude'],
                (float) $validated['longitude'],
                $reference['lat'],
                $reference['lng']
            );

            if ($distance > $radiusMeters && ! $isSuperadmin) {
                throw ValidationException::withMessages([
                    'latitude' => 'Lokasi GPS berada di luar radius yang diizinkan ('.round($distance).' m).',
                ]);
            }
        }
    }

    /**
     * Jalankan anti-spoof check. Kalau REJECT → throw ValidationException (hard block).
     * Kalau FLAG atau ALLOW → return result untuk disimpan + optional auto-revision.
     *
     * @param  array<string, mixed>  $validated
     * @return array{action: string, score: int, suspicions: array<int, array{code: string, message: string, severity: int}>, metadata: array<string, mixed>}
     */
    private function runAntiSpoof(array $validated, int $mahasiswaId): array
    {
        $isSuperadmin = auth()->user()?->hasRole('superadmin') ?? false;

        $result = $this->gpsAntiSpoof->analyze($validated, $mahasiswaId);

        // Hard-reject on REJECT action, kecuali superadmin bypass
        if ($result['action'] === GpsAntiSpoofService::ACTION_REJECT && ! $isSuperadmin) {
            $reasons = array_column($result['suspicions'], 'message');
            throw ValidationException::withMessages([
                'latitude' => 'Lokasi GPS terdeteksi spoof/fake: '.implode(' | ', array_slice($reasons, 0, 2)),
            ]);
        }

        return $result;
    }

    /**
     * Format review_notes ketika kegiatan di-FLAG oleh anti-spoof (auto-revision).
     *
     * @param  array{action: string, score: int, suspicions: array<int, array{code: string, message: string, severity: int}>, metadata: array<string, mixed>}  $result
     */
    private function buildSpoofReviewNote(array $result): string
    {
        $lines = [
            '🛰️ [GPS Anti-Spoof Auto-Flag]',
            "Risk score: {$result['score']}/100",
            '',
            'Suspicions:',
        ];

        foreach ($result['suspicions'] as $s) {
            $lines[] = '• '.$s['message'];
        }

        $lines[] = '';
        $lines[] = 'Mahasiswa dapat submit ulang dengan lokasi GPS yang valid. DPL dapat override keputusan ini jika terbukti benar.';

        return implode("\n", $lines);
    }
}
