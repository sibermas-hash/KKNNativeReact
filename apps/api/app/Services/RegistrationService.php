<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\AntrianKkn;
use App\Models\KKN\Fakultas;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\SystemSetting;
use App\Repositories\Contracts\RegistrationRepositoryInterface;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RegistrationService
{
    public function __construct(
        private readonly RegistrationRepositoryInterface $registrations,
        private readonly GroupSelectionService $groupSelectionService,
        private readonly RegistrationPortalService $registrationPortalService,
    ) {}

    /**
     * Execute student registration for a KKN period with distributed locking and transaction safety.
     *
     * FIX C12: The locking strategy is now:
     * 1. Acquire cache-based distributed lock (per student + period)
     * 2. Start DB transaction
     * 3. Lock Periode row with lockForUpdate
     * 4. Run all validations inside the lock
     * 5. Create/update records
     * 6. Commit transaction
     * 7. Release cache lock
     *
     * The unique constraint on (mahasiswa_id, periode_id) added in C14 provides
     * a final safety net against race conditions.
     *
     * @param  Mahasiswa  $mahasiswa  The student registering.
     * @param  int  $periodeId  The KKN period ID.
     * @param  int|null  $kelompokId  The group to join, or null for queue-only.
     * @param  string|null  $notes  Optional registration notes.
     * @param  int|null  $userId  The authenticated user ID (for ownership verification).
     * @return PesertaKkn The created or updated registration record.
     *
     * @throws AuthorizationException If the user does not own this mahasiswa record.
     * @throws ValidationException If validation or eligibility fails.
     */
    public function register(Mahasiswa $mahasiswa, int $periodeId, ?int $kelompokId, ?string $notes, ?int $userId = null): PesertaKkn
    {

        // FIX C10: Verify ownership - the authenticated user must own this mahasiswa record
        if ($userId && $mahasiswa->user_id !== $userId) {
            throw new AuthorizationException('Anda tidak memiliki hak untuk mendaftarkan mahasiswa ini.');
        }

        $registration = $this->withRegistrationLocks($mahasiswa, $periodeId, $kelompokId, function () use ($mahasiswa, $periodeId, $kelompokId, $notes) {
            return $this->runAtomically(function () use ($mahasiswa, $periodeId, $kelompokId, $notes) {
                $periode = Periode::query()->lockForUpdate()->findOrFail($periodeId);

                // FIX C9: Use Carbon between() for proper datetime comparison instead of string comparison
                $now = now();
                if ($periode->registration_start && $now->lt($periode->registration_start)) {
                    throw ValidationException::withMessages([
                        'periode_id' => 'Pendaftaran untuk periode ini belum dibuka.',
                    ]);
                }
                if ($periode->registration_end && $now->gt($periode->registration_end)) {
                    throw ValidationException::withMessages([
                        'periode_id' => 'Pendaftaran untuk periode ini sudah ditutup.',
                    ]);
                }

                // 1. GLOBAL FILTER: Cek apakah pernah LULUS KKN di masa lalu (Periode mana pun)
                $hasCompleted = PesertaKkn::query()
                    ->where('mahasiswa_id', $mahasiswa->id)
                    ->where('status', 'completed')
                    ->exists();

                if ($hasCompleted) {
                    throw ValidationException::withMessages([
                        'periode_id' => 'Pendaftaran ditolak. Anda sudah dinyatakan LULUS KKN pada periode sebelumnya.',
                    ]);
                }

                // 2. DYNAMIC ELIGIBILITY FILTER: Check SKS, GPA, and program-specific rules
                $eligibility = app(EligibilityService::class)->checkEligibility($mahasiswa, $periodeId);
                if (! $eligibility['is_eligible']) {
                    $reason = $eligibility['issues'][0]['message'] ?? 'Anda belum memenuhi syarat akademik untuk mengikuti periode KKN ini.';
                    throw ValidationException::withMessages([
                        'periode_id' => $reason,
                    ]);
                }

                // 3. FACULTY FILTER: Cek apakah mahasiswa sesuai dengan fakultas lokasi (jika dibatasi)
                if ($kelompokId) {
                    $kelompok = KelompokKkn::query()->with('lokasi')->findOrFail($kelompokId);
                    if ($kelompok->lokasi?->fakultas_id && $mahasiswa->fakultas_id && $kelompok->lokasi->fakultas_id !== $mahasiswa->fakultas_id) {
                        $facultyName = Fakultas::find($kelompok->lokasi->fakultas_id)?->nama ?? 'Fakultas Lain';
                        throw ValidationException::withMessages([
                            'kelompok_id' => "Kelompok ini khusus untuk mahasiswa {$facultyName}. Anda berasal dari fakultas yang berbeda.",
                        ]);
                    }
                }

                // 4. ACTIVE FILTER: Cek apakah sedang mengikuti KKN di periode lain (Status Approved/Pending)
                $activeInOtherPeriod = PesertaKkn::query()
                    ->where('mahasiswa_id', $mahasiswa->id)
                    ->where('periode_id', '!=', $periodeId)
                    ->whereIn('status', ['pending', 'approved'])
                    ->exists();

                if ($activeInOtherPeriod) {
                    throw ValidationException::withMessages([
                        'periode_id' => 'Anda masih memiliki pendaftaran aktif di periode KKN lain. Harap selesaikan atau batalkan pendaftaran tersebut terlebih dahulu.',
                    ]);
                }

                // 5. QUOTA FILTER (audit R9-R02): enforce periode->kuota.
                // Sebelumnya kuota hanya di-cek di level kelompok saat
                // plotting. Untuk periode dengan kuota global yang ditetapkan
                // LPPM, kita perlu block pendaftar baru sebelum create row.
                // Hitung existing pendaftar (termasuk pending + approved + document_submitted)
                // tapi EXCLUDE peserta yang sedang resubmit (status=rejected trashed).
                if ((int) ($periode->kuota ?? 0) > 0) {
                    $activeCount = PesertaKkn::query()
                        ->where('periode_id', $periodeId)
                        ->whereIn('status', ['pending', 'approved', 'document_submitted', 'document_verified'])
                        // Exclude record milik mahasiswa ini sendiri (re-register scenario)
                        ->where('mahasiswa_id', '!=', $mahasiswa->id)
                        ->lockForUpdate()
                        ->count();

                    if ($activeCount >= (int) $periode->kuota) {
                        throw ValidationException::withMessages([
                            'periode_id' => "Kuota periode KKN telah penuh ({$activeCount}/{$periode->kuota} pendaftar). Silakan daftar di periode berikutnya.",
                        ]);
                    }
                }

                $existing = PesertaKkn::query()
                    ->withTrashed() // FIX POIN B: Check trashed records too
                    ->where('mahasiswa_id', $mahasiswa->id)
                    ->where('periode_id', $periodeId)
                    ->lockForUpdate()
                    ->first();

                $queue = $this->groupSelectionService->ensureQueue($mahasiswa, $periodeId, true);

                if ($existing && $existing->trashed()) {
                    // Restore if it was soft-deleted, resetting its status
                    $existing->restore();
                    $existing->status = 'pending';
                    $existing->save();
                }

                if (! $existing) {
                    try {
                        // FIX C12 & C14: Wrap in try-catch to handle unique constraint violation gracefully
                        // The unique constraint on (mahasiswa_id, periode_id) prevents race condition duplicates
                        $existing = $this->registrations->create([
                            'mahasiswa_id' => $mahasiswa->id,
                            'periode_id' => $periodeId,
                            'kelompok_id' => null,
                            'notes' => $notes,
                            'status' => 'pending',
                            'registration_date' => now(),
                        ]);
                    } catch (QueryException $e) {
                        // Handle unique constraint violation (race condition edge case)
                        if ($this->isUniqueConstraintViolation($e)) {
                            // Re-query to get the existing registration
                            $existing = PesertaKkn::query()
                                ->withTrashed()
                                ->where('mahasiswa_id', $mahasiswa->id)
                                ->where('periode_id', $periodeId)
                                ->lockForUpdate()
                                ->firstOrFail();

                            if ($existing->trashed()) {
                                $existing->restore();
                            }

                            // If it's in a rejected state, allow resubmission
                            if ($existing->status === 'rejected') {
                                $existing->status = 'pending';
                                $existing->notes = $notes;
                                $existing->kelompok_id = null;
                                $existing->approved_at = null;
                                $existing->approved_by = null;
                                $existing->joined_group_at = null;
                                $existing->group_locked_until = null;
                                $existing->resubmitted_at = now();
                                $existing->revision_count = (int) ($existing->revision_count ?? 0) + 1;
                                $existing->save();
                            } else {
                                throw ValidationException::withMessages([
                                    'periode_id' => 'Anda sudah memiliki pendaftaran aktif untuk periode ini.',
                                ]);
                            }
                        } else {
                            throw $e;
                        }
                    }
                } elseif ($existing->status === 'completed') {
                    throw ValidationException::withMessages([
                        'periode_id' => 'Status pendaftaran Anda pada periode ini tidak mengizinkan perubahan kelompok.',
                    ]);
                } elseif ($existing->status === 'rejected') {
                    $existing->status = 'pending';
                    $existing->notes = $notes;
                    $existing->kelompok_id = null;
                    $existing->approved_at = null;
                    $existing->approved_by = null;
                    $existing->joined_group_at = null;
                    $existing->group_locked_until = null;
                    $existing->resubmitted_at = now();
                    $existing->revision_count = (int) ($existing->revision_count ?? 0) + 1;
                    $existing->save();
                } else {
                    $existing->notes = $notes;
                    $existing->save();
                }

                // FIX C18: When kelompokId is null, preserve existing group assignment
                // This is intentional for re-registration scenarios where student updates notes/documents
                // without changing their group selection
                if (! $kelompokId) {
                    $queue->status = $existing->kelompok_id ? 'dalam_kelompok' : 'menunggu';
                    $queue->save();

                    return $existing->fresh(['kelompok.lokasi', 'kelompok.dosen', 'periode']);
                }

                $kelompok = KelompokKkn::query()
                    ->where('periode_id', $periode->id)
                    ->where('status', 'active')
                    ->findOrFail($kelompokId);

                $updated = $this->groupSelectionService->assignGroup($existing, $mahasiswa, $kelompok->id);
                $updated->notes = $notes;
                $updated->save();

                return $updated->fresh(['kelompok.lokasi', 'kelompok.dosen', 'periode']);
            });
        });

        $this->registrationPortalService->invalidateActivePeriodsSnapshot();

        return $registration;
    }

    public function leaveGroup(Mahasiswa $mahasiswa, int $periodeId): PesertaKkn
    {
        $registration = $this->withRegistrationLocks($mahasiswa, $periodeId, null, function () use ($mahasiswa, $periodeId) {
            return $this->runAtomically(function () use ($mahasiswa, $periodeId) {
                $registration = PesertaKkn::query()
                    ->where('mahasiswa_id', $mahasiswa->id)
                    ->where('periode_id', $periodeId)
                    ->lockForUpdate()
                    ->first();

                if (! $registration) {
                    throw ValidationException::withMessages([
                        'periode_id' => 'Pendaftaran periode ini tidak ditemukan.',
                    ]);
                }

                return $this->groupSelectionService->leaveGroup($registration, $mahasiswa);
            });
        });

        $this->registrationPortalService->invalidateActivePeriodsSnapshot();

        return $registration;
    }

    public function registrationSummaryForPeriod(?PesertaKkn $registration, ?AntrianKkn $queue): ?array
    {
        if (! $registration) {
            return null;
        }

        return [
            'id' => $registration->id,
            'status' => $registration->status,
            'notes' => $registration->notes,
            'rejection_reason' => $registration->rejection_reason,
            'last_rejected_at' => $registration->last_rejected_at?->toIso8601String(),
            'resubmitted_at' => $registration->resubmitted_at?->toIso8601String(),
            'revision_count' => (int) ($registration->revision_count ?? 0),
            'kelompok_id' => $registration->kelompok_id,
            'joined_group_at' => $registration->joined_group_at?->toIso8601String(),
            'group_locked_until' => $registration->group_locked_until?->toIso8601String(),
            'group' => $registration->kelompok ? [
                'id' => $registration->kelompok->id,
                'name' => $registration->kelompok->nama_kelompok,
                'location' => $registration->kelompok->lokasi ? [
                    'id' => $registration->kelompok->lokasi->id,
                    'name' => $registration->kelompok->lokasi->full_name ?: $registration->kelompok->lokasi->village_name,
                ] : null,
            ] : null,
            'queue' => [
                'status' => $queue?->status ?? ($registration->kelompok_id ? 'dalam_kelompok' : 'menunggu'),
                'penalti_poin' => $queue?->penalti_poin ?? 0,
                'pindah_count' => $queue?->pindah_count ?? 0,
                'max_group_moves' => $this->groupSelectionService->maxGroupMoves(),
            ],
        ];
    }

    private function runAtomically(callable $callback): mixed
    {
        $connection = DB::getFacadeRoot();

        if ($connection->transactionLevel() > 0 || $connection->getPdo()->inTransaction()) {
            return $callback();
        }

        return $connection->transaction($callback);
    }

    private function withRegistrationLocks(Mahasiswa $mahasiswa, int $periodeId, ?int $kelompokId, callable $callback): mixed
    {
        $ttl = max(3, (int) SystemSetting::get('registration_lock_ttl_seconds', 8));
        $wait = max(1, (int) SystemSetting::get('registration_lock_wait_seconds', 6));
        $store = Cache::store($this->lockStore());

        try {
            return $store->lock($this->studentLockKey($mahasiswa->id, $periodeId), $ttl)
                ->block($wait, function () use ($periodeId, $kelompokId, $ttl, $wait, $callback) {
                    if (! $kelompokId) {
                        return $callback();
                    }

                    return Cache::store($this->lockStore())
                        ->lock($this->groupLockKey($periodeId, $kelompokId), $ttl)
                        ->block($wait, $callback);
                });
        } catch (LockTimeoutException) {
            $this->throwRegistrationLockTimeout($kelompokId);
        }
    }

    private function studentLockKey(int $mahasiswaId, int $periodeId): string
    {
        return "registration:student:{$mahasiswaId}:period:{$periodeId}";
    }

    private function groupLockKey(int $periodeId, int $kelompokId): string
    {
        return "registration:group:{$periodeId}:{$kelompokId}";
    }

    private function lockStore(): string
    {
        return (string) config('cache.registration_lock_store', config('cache.default'));
    }

    private function throwRegistrationLockTimeout(?int $kelompokId): never
    {
        if ($kelompokId) {
            $group = KelompokKkn::query()
                ->withCount([
                    'peserta' => function ($query) {
                        $query->whereIn('status', GroupSelectionService::activeRegistrationStatuses());
                    },
                ])
                ->find($kelompokId);

            if (! $group || $group->status !== 'active') {
                throw ValidationException::withMessages([
                    'kelompok_id' => 'Kelompok yang dipilih sudah tidak tersedia.',
                ]);
            }

            if ((int) ($group->peserta_count ?? 0) >= (int) $group->capacity) {
                throw ValidationException::withMessages([
                    'kelompok_id' => "Kelompok {$group->nama_kelompok} sudah penuh.",
                ]);
            }
        }

        throw ValidationException::withMessages([
            'kelompok_id' => 'Sistem sedang memproses lonjakan pendaftaran. Silakan tunggu beberapa detik lalu coba lagi.',
        ]);
    }

    /**
     * Check if a QueryException is a unique constraint violation.
     * FIX C12 & C14: Used to handle race condition edge cases gracefully.
     */
    private function isUniqueConstraintViolation(QueryException $e): bool
    {
        $errorCode = $e->errorInfo[1] ?? null;

        // MySQL/MariaDB error code 1062 = Duplicate entry
        // PostgreSQL error code 23505 = unique_violation
        return in_array($errorCode, [1062, 23505], true)
            || str_contains($e->getMessage(), 'UNIQUE constraint failed')
            || str_contains($e->getMessage(), 'Duplicate entry')
            || str_contains($e->getMessage(), 'peserta_kkn_mahasiswa_period_unique');
    }
}
