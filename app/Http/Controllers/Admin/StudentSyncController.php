<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\StudentSyncService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentSyncController extends Controller
{
    public function __construct(
        private StudentSyncService $syncService
        )
    {
    }

    public function index(): Response
    {
        return Inertia::render('Admin/Students/Sync', [
            'title' => 'Sinkronisasi Mahasiswa dari API Kampus'
        ]);
    }

    public function sync(Request $request): RedirectResponse
    {
        // For large datasets, this should ideally be queued, 
        // but for now we'll run it synchronously as requested.
        $results = $this->syncService->syncFromApi();

        return back()->with('success', "Berhasil sinkronisasi {$results['synced']} mahasiswa. Terjadi {$results['errors']} kesalahan.");
    }
}