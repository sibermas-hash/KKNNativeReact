<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\KegiatanKkn;
use Illuminate\Support\Facades\DB;

class LogbookService
{
    /**
     * Create a new logbook entry using KegiatanKkn model
     */
    public function createEntry(
        int $mahasiswaId,
        int $kelompokId,
        string $date,
        string $title,
        string $activity,
        ?string $reflection = null,
        ?string $output = null,
        ?float $latitude = null,
        ?float $longitude = null,
        ?string $locationName = null,
        array $documentationFiles = []
    ): KegiatanKkn {
        return DB::transaction(function () use ($mahasiswaId, $kelompokId, $date, $title, $activity, $reflection, $output, $latitude, $longitude, $locationName, $documentationFiles) {
            $kegiatan = KegiatanKkn::create([
                'mahasiswa_id' => $mahasiswaId,
                'kelompok_id' => $kelompokId,
                'date' => $date,
                'title' => $title,
                'activity' => $activity,
                'reflection' => $reflection,
                'output' => $output,
                'latitude' => $latitude,
                'longitude' => $longitude,
                'location_name' => $locationName,
                'status' => 'submitted',
            ]);

            // If there are files, we can handle them
            foreach ($documentationFiles as $file) {
                $filename = time().'_'.$mahasiswaId.'_'.$file->getClientOriginalName();
                $path = $file->storeAs("daily_reports/{$kelompokId}", $filename, 'public');

                if (method_exists($kegiatan, 'fileKegiatan')) {
                    $kegiatan->fileKegiatan()->create(['file_path' => $path]);
                }
            }

            return $kegiatan;
        });
    }

    /**
     * Review logbook entry
     */
    public function reviewEntry(
        int $kegiatanId,
        int $reviewerId,
        string $status,
        ?string $reviewNotes = null
    ): KegiatanKkn {
        $kegiatan = KegiatanKkn::findOrFail($kegiatanId);

        $kegiatan->update([
            'status' => $status,
            'review_notes' => $reviewNotes,
            'reviewed_by' => $reviewerId,
            'reviewed_at' => now(),
        ]);

        return $kegiatan->fresh();
    }

    /**
     * Get student's logbook summary
     */
    public function getStudentLogbooks(int $mahasiswaId, int $kelompokId): array
    {
        $kegiatan = KegiatanKkn::where('mahasiswa_id', $mahasiswaId)
            ->where('kelompok_id', $kelompokId)
            ->orderBy('date', 'desc')
            ->get();

        return [
            'entries' => $kegiatan,
            'statistics' => [
                'total' => $kegiatan->count(),
                'approved' => $kegiatan->where('status', 'approved')->count(),
                'pending' => $kegiatan->where('status', 'submitted')->count(),
                'rejected' => $kegiatan->where('status', 'rejected')->count(),
            ],
        ];
    }
}
