<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Services\MasterApiService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Gate;
use Inertia\Response;

class DplSyncController extends Controller
{
    public function __construct(
        private MasterApiService $masterApi
    ) {}

    public function index(): Response
    {
        Gate::authorize('sync-data');

        return Inertia::render('Admin/Operational/Dpl/Sync', [
            'title' => 'Sinkronisasi Master Dosen',
            'summary' => [
                'local_lecturers' => Dosen::count(),
                'with_master_link' => Dosen::whereNotNull('master_id')->count(),
                'last_synced_at' => Dosen::query()
                    ->whereNotNull('master_synced_at')
                    ->max('master_synced_at'),
            ],
        ]);
    }

    public function sync(Request $request): RedirectResponse
    {
        Gate::authorize('sync-data');

        $validated = $request->validate([
            'nip_list' => ['nullable', 'string'],
        ]);

        $nipList = collect(preg_split('/[\s,;]+/', (string) ($validated['nip_list'] ?? '')))
            ->map(static fn ($nip) => trim((string) $nip))
            ->filter()
            ->unique()
            ->values()
            ->all();

        try {
            $externalDosen = count($nipList) > 0
                ? $this->masterApi->getEmployeesByNipList($nipList)
                : $this->masterApi->getAllEmployees();

            $results = $this->syncDosenRecords($externalDosen);

            $modeLabel = count($nipList) > 0
                ? 'sinkronisasi NIP terpilih'
                : 'sinkronisasi seluruh dosen';

            return back()->with(
                'success',
                "Berhasil {$modeLabel}: {$results['synced']} dosen sinkron, {$results['errors']} gagal dari total {$results['total']} data. Akun login tidak dibuat otomatis."
            );
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('DPL sync failed', ['error' => $e->getMessage()]);
            return back()->with('error', 'Gagal melakukan sinkronisasi. Silakan coba lagi atau hubungi administrator.');
        }
    }

    private function syncDosenRecords(array $externalDosen): array
    {
        $synced = 0;
        $errors = 0;

        foreach ($externalDosen as $dosen) {
            $nip = trim((string) ($dosen['nip'] ?? ''));
            $name = trim((string) ($dosen['name'] ?? ''));

            if ($nip === '' || $name === '') {
                $errors++;
                continue;
            }

            try {
                $facultyId = null;
                $organizationMasterId = $this->normalizeMasterId($dosen['organization_id'] ?? null);

                if ($organizationMasterId !== null) {
                    $facultyId = Fakultas::where('master_id', $organizationMasterId)->value('id');
                }

                if (!$facultyId) {
                    $facultyId = Fakultas::query()->value('id');
                }

                if (!$facultyId) {
                    throw new \RuntimeException('Master fakultas belum tersedia untuk pemetaan dosen.');
                }

                Dosen::updateOrCreate(
                    ['nip' => $nip],
                    [
                        'nama' => $name,
                        'birth_date' => $dosen['birth_date'] ?? null,
                        'gender' => $dosen['gender'] ?? null,
                        'faculty_id' => $facultyId,
                        'master_id' => $this->normalizeMasterId($dosen['id'] ?? $dosen['master_id'] ?? null),
                        'master_synced_at' => now(),
                    ]
                );

                $synced++;
            } catch (\Throwable $exception) {
                $errors++;

                \Illuminate\Support\Facades\Log::warning('DPL master record sync skipped', [
                    'nip' => $nip,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        return [
            'total' => count($externalDosen),
            'synced' => $synced,
            'errors' => $errors,
        ];
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
