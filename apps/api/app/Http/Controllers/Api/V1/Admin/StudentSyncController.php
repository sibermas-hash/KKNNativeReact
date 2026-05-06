<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Jobs\SyncAllMahasiswaJob;
use App\Models\KKN\Mahasiswa;
use App\Services\StudentSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentSyncController extends Controller
{
    use ApiResponse;

    public function __construct(private StudentSyncService $syncService) {}

    public function index(): JsonResponse
    {
        return $this->success([
            'local_students'    => Mahasiswa::count(),
            'with_master_link'  => Mahasiswa::whereNotNull('master_id')->count(),
            'last_synced_at'    => Mahasiswa::whereNotNull('master_synced_at')->max('master_synced_at'),
        ]);
    }

    public function sync(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nim_list' => ['nullable', 'string'],
        ]);

        $nimList = collect(preg_split('/[\s,;]+/', (string) ($validated['nim_list'] ?? '')))
            ->map(fn ($nim) => trim((string) $nim))
            ->filter()
            ->unique()
            ->values()
            ->all();

        $isFullSync  = empty($nimList);
        $isLargeSync = count($nimList) > 50;

        if ($isFullSync || $isLargeSync) {
            SyncAllMahasiswaJob::dispatch($nimList ?: null);

            $message = $isFullSync
                ? 'Sinkronisasi seluruh mahasiswa dijadwalkan di latar belakang.'
                : 'Sinkronisasi '.count($nimList).' mahasiswa dijadwalkan di latar belakang.';

            return $this->success(['queued' => true], $message);
        }

        $results = $this->syncService->syncFromApi($nimList);

        return $this->success($results, "Sinkronisasi selesai: {$results['synced']} berhasil, {$results['errors']} gagal.");
    }
}
