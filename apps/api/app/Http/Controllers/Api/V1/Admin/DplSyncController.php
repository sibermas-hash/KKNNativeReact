<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Helpers\PasswordHelper;
use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Models\User;
use App\Services\MasterApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;

class DplSyncController extends Controller
{
    use ApiResponse;

    public function __construct(private MasterApiService $masterApi) {}

    public function index(): JsonResponse
    {
        return $this->success([
            'local_lecturers'   => Dosen::count(),
            'with_master_link'  => Dosen::whereNotNull('master_id')->count(),
            'with_user_account' => Dosen::whereNotNull('user_id')->count(),
            'last_synced_at'    => Dosen::whereNotNull('master_synced_at')->max('master_synced_at'),
        ]);
    }

    public function sync(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nip_list' => ['nullable', 'string'],
        ]);

        $nipList = collect(preg_split('/[\s,;]+/', (string) ($validated['nip_list'] ?? '')))
            ->map(fn ($nip) => trim((string) $nip))
            ->filter()
            ->unique()
            ->values()
            ->all();

        try {
            $externalDosen = count($nipList) > 0
                ? $this->masterApi->getEmployeesByNipList($nipList)
                : $this->masterApi->yieldSyncDosen();

            $results = $this->syncDosenRecords($externalDosen);

            return $this->success($results, "Sinkronisasi selesai: {$results['synced']} berhasil, {$results['errors']} gagal.");
        } catch (\Exception $e) {
            Log::error('DPL sync failed', ['error' => $e->getMessage()]);

            return $this->error('SYNC_FAILED', 'Gagal melakukan sinkronisasi: '.$e->getMessage(), 500);
        }
    }

    private function syncDosenRecords(iterable $externalDosen): array
    {
        $synced  = 0;
        $errors  = 0;
        $total   = 0;

        $facultyMap      = Fakultas::query()->pluck('id', 'master_id');
        $defaultFacultyId = Fakultas::query()->orderBy('id')->value('id');

        foreach ($externalDosen as $dosen) {
            $total++;
            $nip  = trim((string) ($dosen['nip'] ?? ''));
            $name = trim((string) ($dosen['name'] ?? $dosen['nama'] ?? ''));

            if ($nip === '' || $name === '') {
                $errors++;
                continue;
            }

            try {
                DB::transaction(function () use ($dosen, $nip, $name, $facultyMap, $defaultFacultyId, &$synced) {
                    $masterId   = $this->normalizeMasterId($dosen['organization_id'] ?? null);
                    $facultyId  = $masterId ? ($facultyMap[$masterId] ?? null) : null;

                    // Audit fix: fakultas_id may legitimately be null for
                    // external (LB-*) lecturers. Fall back to the default only
                    // when SIAKAD supplied an unmapped id; otherwise keep null
                    // and let admin assign later.
                    if ($masterId !== null && ! $facultyId) {
                        $facultyId = $defaultFacultyId;
                    }

                    $user = User::firstOrNew(['username' => $nip]);
                    $isNewUser = ! $user->exists;
                    if ($isNewUser) {
                        $user->email    = $this->normalizeMasterEmail($dosen['email'] ?? null);
                        // C-002 fix: secure random password; reset link below.
                        $user->password = Hash::make(PasswordHelper::generateSecureDefault());
                        $user->must_change_password = true;
                    } elseif (empty($user->email) && $this->normalizeMasterEmail($dosen['email'] ?? null)) {
                        $user->email = $this->normalizeMasterEmail($dosen['email'] ?? null);
                    }
                    $user->name = $name;
                    $user->save();

                    if (! $user->hasRole('dosen')) {
                        $user->assignRole('dosen');
                    }

                    Dosen::updateOrCreate(
                        ['nip' => $nip],
                        [
                            'user_id'          => $user->id,
                            'nama'             => $name,
                            'birth_date'       => $dosen['birth_date'] ?? $dosen['tanggal_lahir'] ?? null,
                            'gender'           => $dosen['gender'] ?? $dosen['jenis_kelamin'] ?? null,
                            'fakultas_id'      => $facultyId,
                            'phone'            => $dosen['phone'] ?? $dosen['no_hp'] ?? null,
                            'master_id'        => $this->normalizeMasterId($dosen['id'] ?? null),
                            'master_synced_at' => now(),
                        ]
                    );

                    // C-002 follow-up: dispatch reset link after commit.
                    if ($isNewUser && ! empty($user->email)) {
                        $userEmail = $user->email;
                        DB::afterCommit(function () use ($userEmail, $nip) {
                            try {
                                Password::sendResetLink(['email' => $userEmail]);
                            } catch (\Throwable $e) {
                                Log::warning('DplSyncController reset-link dispatch failed', [
                                    'nip' => $nip, 'error' => $e->getMessage(),
                                ]);
                            }
                        });
                    }

                    $synced++;
                });
            } catch (\Throwable $e) {
                $errors++;
                Log::warning('DPL sync record skipped', ['nip' => $nip, 'error' => $e->getMessage()]);
            }
        }

        return ['total' => $total, 'synced' => $synced, 'errors' => $errors];
    }

    private function normalizeMasterId(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $v = trim((string) $value);

        return $v === '' ? null : $v;
    }

    private function normalizeMasterEmail(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $email = trim((string) $value);
        if ($email === '' || str_ends_with(strtolower($email), '@kkn.local')) {
            return null;
        }

        return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : null;
    }
}
