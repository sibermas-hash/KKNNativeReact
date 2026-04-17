<?php

declare(strict_types=1);

namespace App\Http\Controllers\Dpl;

use App\Constants\AppConstants;
use App\Http\Controllers\Controller;
use App\Models\KKN\FileKegiatanKkn;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KelompokKkn;
use App\Notifications\KknActivityNotification;
use App\Services\GeoService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class DailyReportController extends Controller
{
    public function __construct(
        private readonly GeoService $geoService,
    ) {}

    private function resolveReferenceCoordinates(KegiatanKkn $dailyReport): ?array
    {
        if ($dailyReport->kelompok?->posko?->latitude !== null && $dailyReport->kelompok?->posko?->longitude !== null) {
            return [
                'label' => 'Posko Kelompok',
                'latitude' => (float) $dailyReport->kelompok->posko->latitude,
                'longitude' => (float) $dailyReport->kelompok->posko->longitude,
            ];
        }

        if ($dailyReport->kelompok?->lokasi?->latitude !== null && $dailyReport->kelompok?->lokasi?->longitude !== null) {
            return [
                'label' => $dailyReport->kelompok->lokasi->full_name ?: $dailyReport->kelompok->lokasi->village_name ?: 'Lokasi KKN',
                'latitude' => (float) $dailyReport->kelompok->lokasi->latitude,
                'longitude' => (float) $dailyReport->kelompok->lokasi->longitude,
            ];
        }

        return null;
    }

    private function assignedGroupIds(): Collection
    {
        $dosen = auth()->user()->dosen;
        abort_if(! $dosen, 403, 'Data dosen tidak ditemukan.');

        return $dosen->kelompokKkn()->pluck('kelompok_kkn.id');
    }

    private function canReview(KegiatanKkn $dailyReport): bool
    {
        return in_array($dailyReport->status, ['submitted', 'revision'], true);
    }

    public function index(Request $request): Response
    {
        $dosen = auth()->user()->dosen;
        abort_if(! $dosen, 403);

        $groupIds = $this->assignedGroupIds();

        // Get groups with pending counts for the tab/filter UI
        $groups = KelompokKkn::whereIn('id', $groupIds)
            ->withCount(['kegiatan' => function ($query) {
                $query->where('status', 'submitted');
            }])
            ->get()
            ->map(fn ($group) => [
                'id' => $group->id,
                'name' => $group->nama_kelompok ?? $group->code,
                'pending_count' => $group->kegiatan_count,
            ]);

        $kegiatan = KegiatanKkn::whereIn('kelompok_id', $groupIds)
            ->with(['mahasiswa', 'kelompok'])
            ->when($request->input('kelompok_id'), fn ($q, $id) => $q->where('kelompok_id', $id))
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->orderByDesc('date')
            ->paginate(15)
            ->through(fn (KegiatanKkn $report) => [
                'id' => $report->id,
                'date' => optional($report->date)->format('d M Y') ?? '-',
                'title' => $report->title,
                'status' => $report->status,
                'student' => [
                    'name' => $report->mahasiswa?->nama ?? 'Mahasiswa tidak ditemukan',
                    'nim' => $report->mahasiswa?->nim ?? '-',
                ],
                'group' => [
                    'id' => $report->kelompok_id,
                    'name' => $report->kelompok?->nama_kelompok ?? $report->kelompok?->code ?? '-',
                ],
                'ai_summary' => $report->ai_summary,
                'ai_analysis' => $report->ai_analysis,
            ])
            ->withQueryString();

        return Inertia::render('Dpl/DailyReports/Index', [
            'reports' => $kegiatan,
            'groups' => $groups,
            'filters' => $request->only(['status', 'kelompok_id']),
        ]);
    }

    public function show(KegiatanKkn $dailyReport): Response
    {
        $groupIds = $this->assignedGroupIds();
        abort_if(! $groupIds->contains($dailyReport->kelompok_id), 403, 'Anda tidak memiliki akses ke laporan ini.');

        $dailyReport->load(['mahasiswa', 'kelompok.lokasi', 'kelompok.posko', 'fileKegiatan', 'reviewer']);
        $reference = $this->resolveReferenceCoordinates($dailyReport);
        $distance = null;

        if (
            $reference
            && $dailyReport->latitude !== null
            && $dailyReport->longitude !== null
        ) {
            $distance = round($this->geoService->calculateDistanceMeters(
                (float) $dailyReport->latitude,
                (float) $dailyReport->longitude,
                $reference['latitude'],
                $reference['longitude'],
            ));
        }

        return Inertia::render('Dpl/DailyReports/Show', [
            'report' => [
                'id' => $dailyReport->id,
                'date' => optional($dailyReport->date)->format('d M Y') ?? '-',
                'title' => $dailyReport->title,
                'activity' => $dailyReport->activity,
                'output' => $dailyReport->output,
                'latitude' => $dailyReport->latitude,
                'longitude' => $dailyReport->longitude,
                'gps' => [
                    'accuracy' => $dailyReport->gps_accuracy,
                    'captured_at' => optional($dailyReport->captured_at)->toIso8601String(),
                    'source' => $dailyReport->location_source,
                    'reference_label' => $reference['label'] ?? null,
                    'distance_to_reference_meters' => $distance,
                ],
                'status' => $dailyReport->status,
                'can_review' => $this->canReview($dailyReport),
                'review_notes' => $dailyReport->review_notes,
                'student' => [
                    'name' => $dailyReport->mahasiswa?->nama ?? 'Mahasiswa tidak ditemukan',
                    'nim' => $dailyReport->mahasiswa?->nim ?? '-',
                ],
                'group' => [
                    'name' => $dailyReport->kelompok?->nama_kelompok ?? $dailyReport->kelompok?->code ?? '-',
                    'location' => [
                        'village_name' => $dailyReport->kelompok?->lokasi?->village_name,
                        'address' => $dailyReport->kelompok?->lokasi?->address,
                    ],
                ],
                'file_kegiatan' => $dailyReport->fileKegiatan->map(fn (FileKegiatanKkn $file) => [
                    'id' => $file->id,
                    'file_name' => $file->file_name,
                    'file_path' => $file->file_path,
                    'download_url' => route('dpl.daily-reports.files.download', $file),
                    'preview_url' => route('dpl.daily-reports.files.preview', $file),
                    'is_image' => in_array(
                        strtolower(pathinfo($file->file_name ?? $file->file_path, PATHINFO_EXTENSION)),
                        ['jpg', 'jpeg', 'png', 'webp', 'gif']
                    ),
                ])->values(),
                'ai_summary' => $dailyReport->ai_summary,
                'ai_analysis' => $dailyReport->ai_analysis,
            ],
        ]);
    }

    public function downloadFile(FileKegiatanKkn $fileKegiatan): mixed
    {
        $groupIds = $this->assignedGroupIds();
        $fileKegiatan->loadMissing('kegiatan');

        abort_if(
            ! $fileKegiatan->kegiatan || ! $groupIds->contains($fileKegiatan->kegiatan->kelompok_id),
            403,
            'Anda tidak memiliki akses ke lampiran ini.'
        );

        $defaultDisk = config('filesystems.default');
        $foundDisk = null;

        // Check disks in order
        foreach (['local', 'public', $defaultDisk] as $diskName) {
            if (Storage::disk($diskName)->exists($fileKegiatan->file_path)) {
                $foundDisk = $diskName;
                break;
            }
        }

        abort_if($foundDisk === null, 404, 'File lampiran tidak ditemukan.');

        $disk = Storage::disk($foundDisk);

        // If it's a local disk, use download response
        if (in_array($foundDisk, ['local', 'public'])) {
            return $disk->download(
                $fileKegiatan->file_path,
                $fileKegiatan->file_name ?: basename($fileKegiatan->file_path)
            );
        }

        // For Cloud Storage (S3/R2), use a secure temporary URL
        return redirect()->away($disk->temporaryUrl($fileKegiatan->file_path, now()->addMinutes(30)));
    }

    /**
     * Serve file inline for browser preview (images displayed directly).
     */
    public function previewFile(FileKegiatanKkn $fileKegiatan): \Symfony\Component\HttpFoundation\Response
    {
        $groupIds = $this->assignedGroupIds();
        $fileKegiatan->loadMissing('kegiatan');

        abort_if(
            ! $fileKegiatan->kegiatan || ! $groupIds->contains($fileKegiatan->kegiatan->kelompok_id),
            403,
            'Anda tidak memiliki akses ke lampiran ini.'
        );

        $defaultDisk = config('filesystems.default');
        $foundDisk = null;

        foreach (['local', 'public', $defaultDisk] as $diskName) {
            if (Storage::disk($diskName)->exists($fileKegiatan->file_path)) {
                $foundDisk = $diskName;
                break;
            }
        }

        abort_if($foundDisk === null, 404, 'File lampiran tidak ditemukan.');

        $disk = Storage::disk($foundDisk);

        // If it's a local disk, stream the file
        if (in_array($foundDisk, ['local', 'public'])) {
            $mimeType = $disk->mimeType($fileKegiatan->file_path);
            $stream = $disk->readStream($fileKegiatan->file_path);

            return response()->stream(function () use ($stream) {
                fpassthru($stream);
                if (is_resource($stream)) {
                    fclose($stream);
                }
            }, 200, [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'inline',
                'Cache-Control' => 'public, max-age=86400',
            ]);
        }

        // For Cloud Storage (S3/R2), redirect to the cloud URL
        // Images can usually be displayed directly via temporaryUrl
        return redirect()->away($disk->temporaryUrl($fileKegiatan->file_path, now()->addMinutes(30)));
    }

    public function approve(KegiatanKkn $dailyReport): RedirectResponse
    {
        $groupIds = $this->assignedGroupIds();
        abort_if(! $groupIds->contains($dailyReport->kelompok_id), 403);

        if (! $this->canReview($dailyReport)) {
            return back()->with('error', 'Laporan harian ini sudah selesai ditinjau dan tidak dapat diproses ulang.');
        }

        $dailyReport->update([
            'status' => 'approved',
            'review_notes' => null,
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        // Notify student
        if ($dailyReport->mahasiswa?->user) {
            $dailyReport->mahasiswa->user->notify(new KknActivityNotification([
                'type' => 'success',
                'title' => 'Laporan Harian Disetujui',
                'message' => 'Laporan harian Anda tanggal '.$dailyReport->date->format('d/m/Y').' telah disetujui.',
                'icon' => 'check-circle',
                'action' => route('student.laporan-harian.index'),
            ]));
        }

        return redirect()->back()->with('success', 'Laporan harian disetujui.');
    }

    public function revision(Request $request, KegiatanKkn $dailyReport): RedirectResponse
    {
        $groupIds = $this->assignedGroupIds();
        abort_if(! $groupIds->contains($dailyReport->kelompok_id), 403);

        if (! $this->canReview($dailyReport)) {
            return back()->with('error', 'Laporan harian ini sudah selesai ditinjau dan tidak dapat diproses ulang.');
        }

        $validated = $request->validate([
            'revision_notes' => ['required', 'string', 'max:1000'],
        ]);

        $dailyReport->update([
            'status' => 'revision',
            'review_notes' => $validated['revision_notes'],
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        // Notify student
        if ($dailyReport->mahasiswa?->user) {
            $dailyReport->mahasiswa->user->notify(new KknActivityNotification([
                'type' => 'warning',
                'title' => 'Revisi Laporan Harian',
                'message' => 'Laporan harian Anda tanggal '.$dailyReport->date->format('d/m/Y').' memerlukan revisi.',
                'icon' => 'exclamation-circle',
                'action' => route('student.laporan-harian.index'),
            ]));
        }

        return redirect()->back()->with('success', 'Laporan dikembalikan untuk revisi.');
    }

    public function batchApprove(Request $request): RedirectResponse
    {
        // SECURITY: Limit batch approve to prevent abuse
        $maxBatchLimit = AppConstants::MAX_BATCH_LIMIT;

        // ADDED: Proper validation
        $validated = $request->validate([
            'group_ids' => ['nullable', 'array'],
            'group_ids.*' => ['integer', 'exists:kelompok_kkn,id'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $groupIds = $this->assignedGroupIds();

        // If specific groups provided, filter by DPL's groups
        if (! empty($validated['group_ids'])) {
            $groupIds = $groupIds->intersect($validated['group_ids']);
        }

        // Build query with optional date range
        $query = KegiatanKkn::whereIn('kelompok_id', $groupIds)
            ->where('status', 'submitted');

        if (! empty($validated['date_from'])) {
            $query->where('date', '>=', $validated['date_from']);
        }
        if (! empty($validated['date_to'])) {
            $query->where('date', '<=', $validated['date_to']);
        }

        // SECURITY: Count first and enforce limit
        $totalCount = $query->count();
        if ($totalCount > $maxBatchLimit) {
            return redirect()->back()->with('error',
                "Persetujuan massal dibatasi maksimal {$maxBatchLimit} laporan per tindakan. Silakan persempit rentang tanggal atau pilih kelompok tertentu."
            );
        }

        $count = $query->update([
            'status' => 'approved',
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        return redirect()->back()->with('success', "{$count} laporan harian berhasil disetujui secara massal.");
    }
}
