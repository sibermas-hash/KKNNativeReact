<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SyncAllMahasiswaJob;
use App\Models\KKN\Mahasiswa;
use App\Services\StudentSyncService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentSyncController extends Controller
{
    public function __construct(
        private StudentSyncService $syncService
    ) {}

    public function index(): Response
    {
        return Inertia::render('Admin/Academic/Students/Sync', [
            'title' => 'Sinkronisasi Mahasiswa dari API Kampus',
            'summary' => [
                'local_students' => Mahasiswa::count(),
                'with_master_link' => Mahasiswa::whereNotNull('master_id')->count(),
                'last_synced_at' => Mahasiswa::query()
                    ->whereNotNull('master_synced_at')
                    ->max('master_synced_at'),
            ],
        ]);
    }

    public function sync(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nim_list' => ['nullable', 'string'],
        ]);

        $nimList = collect(preg_split('/[\s,;]+/', (string) ($validated['nim_list'] ?? '')))
            ->map(static fn ($nim) => trim((string) $nim))
            ->filter()
            ->unique()
            ->values()
            ->all();

        $isFullSync = empty($nimList);
        $isLargeSync = count($nimList) > 50;

        if ($isFullSync || $isLargeSync) {
            SyncAllMahasiswaJob::dispatch($nimList ?: null);

            $message = $isFullSync
                ? 'Sinkronisasi seluruh mahasiswa telah dijadwalkan di latar belakang.'
                : 'Sinkronisasi '.count($nimList).' mahasiswa telah dijadwalkan di latar belakang.';

            return back()->with('success', $message.' Silakan cek beberapa saat lagi.');
        }

        try {
            $results = $this->syncService->syncFromApi($nimList);

            return back()->with('success', "Berhasil sinkronisasi NIM terpilih: {$results['synced']} mahasiswa sinkron, {$results['errors']} gagal dari total {$results['total']} data.");
        } catch (\Exception $e) {
            return back()
                ->with('error', "Gagal sinkronisasi: {$e->getMessage()}")
                ->with('error_detail', $e->getMessage());
        }
    }
}
