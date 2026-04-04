<?php

namespace App\Http\Controllers\Dpl;

use App\Http\Controllers\Controller;
use App\Models\KKN\FileKegiatanKkn;
use App\Models\KKN\KegiatanKkn;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DailyReportController extends Controller
{
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

    private function assignedGroupIds(): \Illuminate\Support\Collection
    {
        $dosen = auth()->user()->dosen;
        abort_if(!$dosen, 403, 'Data dosen tidak ditemukan.');

        return $dosen->kelompokKkn()->pluck('kelompok_kkn.id');
    }

    private function canReview(KegiatanKkn $dailyReport): bool
    {
        return in_array($dailyReport->status, ['submitted', 'revision'], true);
    }

    public function index(Request $request): Response
    {
        $groupIds = $this->assignedGroupIds();

        $kegiatan = KegiatanKkn::whereIn('kelompok_id', $groupIds)
            ->with(['mahasiswa', 'kelompok'])
            ->when($request->input('status'), fn($q, $s) => $q->where('status', $s))
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
                    'name' => $report->kelompok?->nama_kelompok ?? $report->kelompok?->code ?? '-',
                ],
            ])
            ->withQueryString();

        return Inertia::render('Dpl/DailyReports/Index', [
            'reports' => $kegiatan,
            'filters' => $request->only('status'),
        ]);
    }

    public function show(KegiatanKkn $dailyReport): Response
    {
        $groupIds = $this->assignedGroupIds();
        abort_if(!$groupIds->contains($dailyReport->kelompok_id), 403, 'Anda tidak memiliki akses ke laporan ini.');

        $dailyReport->load(['mahasiswa', 'kelompok.lokasi', 'kelompok.posko', 'fileKegiatan', 'reviewer']);
        $reference = $this->resolveReferenceCoordinates($dailyReport);
        $distance = null;

        if (
            $reference
            && $dailyReport->latitude !== null
            && $dailyReport->longitude !== null
        ) {
            $distance = round($this->calculateDistanceMeters(
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
                    'download_url' => route('dpl.daily-reports.files.download', $file),
                ])->values(),
            ],
        ]);
    }

    public function downloadFile(FileKegiatanKkn $fileKegiatan): StreamedResponse
    {
        $groupIds = $this->assignedGroupIds();
        $fileKegiatan->loadMissing('kegiatan');

        abort_if(
            !$fileKegiatan->kegiatan || !$groupIds->contains($fileKegiatan->kegiatan->kelompok_id),
            403,
            'Anda tidak memiliki akses ke lampiran ini.'
        );

        $disk = Storage::disk('local')->exists($fileKegiatan->file_path)
            ? 'local'
            : (Storage::disk('public')->exists($fileKegiatan->file_path) ? 'public' : null);

        abort_if($disk === null, 404, 'File lampiran tidak ditemukan.');

        return Storage::disk($disk)->download($fileKegiatan->file_path, $fileKegiatan->file_name ?: basename($fileKegiatan->file_path));
    }

    public function approve(KegiatanKkn $dailyReport): RedirectResponse
    {
        $groupIds = $this->assignedGroupIds();
        abort_if(!$groupIds->contains($dailyReport->kelompok_id), 403);

        if (!$this->canReview($dailyReport)) {
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
            $dailyReport->mahasiswa->user->notify(new \App\Notifications\KknActivityNotification([
                'type' => 'success',
                'title' => 'Laporan Harian Disetujui',
                'message' => "Laporan harian Anda tanggal " . $dailyReport->date->format('d/m/Y') . " telah disetujui.",
                'icon' => 'check-circle',
                'url' => route('student.laporan-harian.index'),
            ]));
        }

        return redirect()->back()->with('success', 'Laporan harian disetujui.');
    }

    public function revision(Request $request, KegiatanKkn $dailyReport): RedirectResponse
    {
        $groupIds = $this->assignedGroupIds();
        abort_if(!$groupIds->contains($dailyReport->kelompok_id), 403);

        if (!$this->canReview($dailyReport)) {
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
            $dailyReport->mahasiswa->user->notify(new \App\Notifications\KknActivityNotification([
                'type' => 'warning',
                'title' => 'Revisi Laporan Harian',
                'message' => "Laporan harian Anda tanggal " . $dailyReport->date->format('d/m/Y') . " memerlukan revisi.",
                'icon' => 'exclamation-circle',
                'url' => route('student.laporan-harian.index'),
            ]));
        }

        return redirect()->back()->with('success', 'Laporan dikembalikan untuk revisi.');
    }
    public function batchApprove(Request $request): RedirectResponse
    {
        // ADDED: Proper validation
        $validated = $request->validate([
            'group_ids' => ['nullable', 'array'],
            'group_ids.*' => ['integer', 'exists:kelompok_kkn,id'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $groupIds = $this->assignedGroupIds();

        // If specific groups provided, filter by DPL's groups
        if (!empty($validated['group_ids'])) {
            $groupIds = $groupIds->intersect($validated['group_ids']);
        }

        // Build query with optional date range
        $query = KegiatanKkn::whereIn('kelompok_id', $groupIds)
            ->where('status', 'submitted');

        if (!empty($validated['date_from'])) {
            $query->where('date', '>=', $validated['date_from']);
        }
        if (!empty($validated['date_to'])) {
            $query->where('date', '<=', $validated['date_to']);
        }

        $count = $query->update([
            'status' => 'approved',
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        return redirect()->back()->with('success', "{$count} laporan harian berhasil disetujui secara massal.");
    }
}
