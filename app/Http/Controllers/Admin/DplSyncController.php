<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Services\MasterApiService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Gate;
use Inertia\Response;

class DplSyncController extends Controller
{
    public function __construct(
        private MasterApiService $masterApi
    ) {}

    public function index(Request $request): Response
    {
        Gate::authorize('sync-data');
        $externalDosen = $this->masterApi->getAllEmployees();
        $localDosenNips = Dosen::pluck('nip')->toArray();

        // Filter out lecturers that are already in our local database
        $availableDosen = array_filter($externalDosen, function ($d) use ($localDosenNips) {
            return !in_array($d['nip'], $localDosenNips);
        });

        // Filter by search if provided
        if ($search = $request->input('search')) {
            $availableDosen = array_filter($availableDosen, function ($d) use ($search) {
                return stripos($d['name'], $search) !== false || stripos($d['nip'], $search) !== false;
            });
        }

        return Inertia::render('Admin/Dpl/Sync', [
            'availableDosen' => array_values($availableDosen),
            'filters' => $request->only('search'),
            'title' => 'Sinkronisasi Master Dosen'
        ]);
    }

    public function sync(Request $request): RedirectResponse
    {
        Gate::authorize('sync-data');

        $validated = $request->validate([
            'master_id' => 'nullable',
            'nip' => 'required|string',
            'name' => 'required|string',
            'email' => 'nullable|email',
            'organization_id' => 'nullable',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|string',
        ]);

        try {
            DB::transaction(function () use ($validated) {
                // Sinkronisasi master dosen lokal tanpa otomatis membuat akun login.
                $facultyId = null;
                $organizationMasterId = $this->normalizeMasterId($validated['organization_id'] ?? null);
                if ($organizationMasterId !== null) {
                    $facultyId = Fakultas::where('master_id', $organizationMasterId)->first()?->id;
                }

                // Fallback faculty if none found
                if (!$facultyId) {
                    $facultyId = Fakultas::first()?->id;
                }

                Dosen::updateOrCreate(
                    ['nip' => $validated['nip']],
                    [
                        'nama' => $validated['name'],
                        'birth_date' => $validated['birth_date'],
                        'gender' => $validated['gender'],
                        'faculty_id' => $facultyId,
                        'master_id' => $this->normalizeMasterId($validated['master_id'] ?? null),
                        'master_synced_at' => now(),
                    ]
                );
            });

            return back()->with('success', "Dosen {$validated['name']} berhasil disinkronkan ke master lokal. Akun DPL akan dibuat saat dosen diaktifkan pada periode.");
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('DPL sync failed', ['error' => $e->getMessage()]);
            return back()->with('error', 'Gagal melakukan sinkronisasi. Silakan coba lagi atau hubungi administrator.');
        }
    }

    private function normalizeMasterId(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $normalized = trim((string) $value);

        return $normalized === '' ? null : $normalized;
    }
}
