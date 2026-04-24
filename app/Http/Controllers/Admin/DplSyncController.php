<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Helpers\PasswordHelper;
use App\Http\Controllers\Controller;
use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Models\User;
use App\Services\MasterApiService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class DplSyncController extends Controller
{
    public function __construct(
        private MasterApiService $masterApi
    ) {}

    public function index(): Response
    {
        Gate::authorize('sync-data');

        try {
            return Inertia::render('Admin/Operational/Dpl/Sync', [
                'title' => 'Sinkronisasi Master Dosen',
                'summary' => [
                    'local_lecturers' => Dosen::count(),
                    'with_master_link' => Dosen::whereNotNull('master_id')->count(),
                    'with_user_account' => Dosen::whereNotNull('user_id')->count(),
                    'last_synced_at' => Dosen::query()
                        ->whereNotNull('master_synced_at')
                        ->max('master_synced_at'),
                ],
            ]);
        } catch (\Throwable $e) {
            report($e);

            return Inertia::render('Admin/Operational/Dpl/Sync', [
                'title' => 'Sinkronisasi Master Dosen',
                'summary' => [
                    'local_lecturers' => 0,
                    'with_master_link' => 0,
                    'with_user_account' => 0,
                    'last_synced_at' => null,
                ],
                'error' => 'Gagal memuat data sinkronisasi.',
            ]);
        }
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
                : $this->masterApi->yieldSyncDosen();

            $results = $this->syncDosenRecords($externalDosen);

            $modeLabel = count($nipList) > 0
                ? 'sinkronisasi NIP terpilih'
                : 'sinkronisasi seluruh dosen';

            return back()->with(
                'success',
                "Berhasil {$modeLabel}: {$results['synced']} dosen sinkron, {$results['errors']} gagal dari total {$results['total']} data. Akun login dibuat otomatis."
            );
        } catch (\Exception $e) {
            Log::error('DPL sync failed', ['error' => $e->getMessage()]);

            return back()->with('error', 'Gagal melakukan sinkronisasi: '.$e->getMessage());
        }
    }

    private function syncDosenRecords(iterable $externalDosen): array
    {
        $synced = 0;
        $errors = 0;
        $total = 0;

        $facultyMap = Fakultas::query()->pluck('id', 'master_id');
        $defaultFacultyId = Fakultas::query()->orderBy('id')->value('id');

        foreach ($externalDosen as $dosen) {
            $total++;
            $nip = trim((string) ($dosen['nip'] ?? ''));
            $name = trim((string) ($dosen['name'] ?? $dosen['nama'] ?? ''));

            if ($nip === '' || $name === '') {
                $errors++;

                continue;
            }

            try {
                DB::transaction(function () use ($dosen, $nip, $name, $facultyMap, $defaultFacultyId, &$synced) {
                    $organizationMasterId = $this->normalizeMasterId($dosen['organization_id'] ?? null);
                    $facultyId = $organizationMasterId !== null ? ($facultyMap[$organizationMasterId] ?? null) : null;

                    if (! $facultyId) {
                        $facultyId = $defaultFacultyId;
                    }

                    if (! $facultyId) {
                        throw new \RuntimeException('Master fakultas belum tersedia untuk pemetaan dosen.');
                    }

                    $username = (string) $nip;
                    $incomingEmail = $dosen['email'] ?? null;
                    $fallbackEmail = $username.'@kkn.local';

                    $user = User::firstOrNew(['username' => $username]);
                    $isNewUser = ! $user->exists;

                    if ($isNewUser) {
                        $user->email = ! empty($incomingEmail) ? $incomingEmail : $fallbackEmail;
                        $birthDate = $dosen['birth_date'] ?? $dosen['tanggal_lahir'] ?? null;
                        $user->password = Hash::make(
                            PasswordHelper::fromBirthDate($birthDate, $username)
                        );
                    } elseif (empty($user->email)) {
                        $user->email = ! empty($incomingEmail) ? $incomingEmail : $fallbackEmail;
                    }

                    $user->username = $username;
                    $user->name = $name;
                    $user->save();

                    if (! $user->hasRole('dosen')) {
                        $user->assignRole('dosen');
                    }

                    Dosen::updateOrCreate(
                        ['nip' => $nip],
                        [
                            'user_id' => $user->id,
                            'nama' => $name,
                            'birth_date' => $dosen['birth_date'] ?? $dosen['tanggal_lahir'] ?? null,
                            'gender' => $dosen['gender'] ?? $dosen['jenis_kelamin'] ?? null,
                            'fakultas_id' => $facultyId,
                            'phone' => $dosen['phone'] ?? $dosen['telepon'] ?? $dosen['no_hp'] ?? null,
                            'is_cpns' => str_contains(strtoupper($dosen['status_pegawai'] ?? $dosen['employment_status'] ?? ''), 'CPNS'),
                            'is_tugas_belajar' => str_contains(strtoupper($dosen['status_aktif'] ?? $dosen['active_status'] ?? 'AKTIF'), 'TUGAS BELAJAR'),
                            'master_id' => $this->normalizeMasterId($dosen['id'] ?? $dosen['master_id'] ?? null),
                            'master_synced_at' => now(),
                        ]
                    );

                    $synced++;
                });
            } catch (\Throwable $exception) {
                $errors++;

                Log::warning('DPL master record sync skipped', [
                    'nip' => $nip,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        return [
            'total' => $total,
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
