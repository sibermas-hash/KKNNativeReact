<?php

namespace App\Services;

use App\Models\KKN\AntrianKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Repositories\Contracts\RegistrationRepositoryInterface;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RegistrationService
{
    public function __construct(
        private readonly RegistrationRepositoryInterface $registrations,
        private readonly GroupSelectionService $groupSelectionService,
        private readonly RegistrationPortalService $registrationPortalService,
    ) {
    }

    public function register(Mahasiswa $mahasiswa, int $periodeId, ?int $kelompokId, ?string $notes): PesertaKkn
    {
        $registration = $this->withRegistrationLocks($mahasiswa, $periodeId, $kelompokId, function () use ($mahasiswa, $periodeId, $kelompokId, $notes) {
            return $this->runAtomically(function () use ($mahasiswa, $periodeId, $kelompokId, $notes) {
            $periode = Periode::query()->lockForUpdate()->findOrFail($periodeId);

            // 0. REGISTRATION WINDOW: Cek apakah masih dalam periode pendaftaran
            $today = now()->toDateString();
            if ($periode->registration_start && $today < $periode->registration_start) {
                throw ValidationException::withMessages([
                    'period_id' => 'Pendaftaran untuk periode ini belum dibuka.',
                ]);
            }
            if ($periode->registration_end && $today > $periode->registration_end) {
                throw ValidationException::withMessages([
                    'period_id' => 'Pendaftaran untuk periode ini sudah ditutup.',
                ]);
            }

            // 1. GLOBAL FILTER: Cek apakah pernah LULUS KKN di masa lalu (Periode mana pun)
            $hasCompleted = PesertaKkn::query()
                ->where('mahasiswa_id', $mahasiswa->id)
                ->where('status', 'completed')
                ->exists();

            if ($hasCompleted) {
                throw ValidationException::withMessages([
                    'period_id' => 'Pendaftaran ditolak. Anda sudah dinyatakan LULUS KKN pada periode sebelumnya.',
                ]);
            }

            // 2. ACADEMIC FILTER: Cek syarat minimal SKS & BTA-PPI
            $minSks = (int) \App\Models\KKN\SystemSetting::get('min_sks_registration', 100);
            if ($mahasiswa->sks_completed < $minSks) {
                throw ValidationException::withMessages([
                    'period_id' => "Pendaftaran ditolak. Syarat minimal SKS adalah {$minSks} SKS, sedangkan SKS Anda saat ini adalah {$mahasiswa->sks_completed} SKS.",
                ]);
            }

            $hasBtaPpiStatus = array_key_exists('is_bta_ppi_passed', $mahasiswa->getAttributes());

            if ($hasBtaPpiStatus && !$mahasiswa->is_bta_ppi_passed) {
                throw ValidationException::withMessages([
                    'period_id' => 'Pendaftaran ditolak. Anda belum dinyatakan LULUS ujian BTA-PPI. Silakan selesaikan kewajiban sertifikasi tersebut terlebih dahulu.',
                ]);
            }

            // 3. DOCUMENT FILTER: Cek keberadaan Surat Sehat & Izin Orang Tua
            if (!$mahasiswa->health_certificate_path || !$mahasiswa->parent_permission_path) {
                throw ValidationException::withMessages([
                    'period_id' => 'Pendaftaran ditolak. Anda wajib mengunggah Surat Keterangan Sehat dan Surat Izin Orang Tua terlebih dahulu.',
                ]);
            }

            // 4. ACTIVE FILTER: Cek apakah sedang mengikuti KKN di periode lain (Status Approved/Pending)
            $activeInOtherPeriod = PesertaKkn::query()
                ->where('mahasiswa_id', $mahasiswa->id)
                ->where('period_id', '!=', $periodeId)
                ->whereIn('status', ['pending', 'approved'])
                ->exists();

            if ($activeInOtherPeriod) {
                throw ValidationException::withMessages([
                    'period_id' => 'Anda masih memiliki pendaftaran aktif di periode KKN lain. Harap selesaikan atau batalkan pendaftaran tersebut terlebih dahulu.',
                ]);
            }

            $existing = PesertaKkn::query()
                ->where('mahasiswa_id', $mahasiswa->id)
                ->where('period_id', $periodeId)
                ->lockForUpdate()
                ->first();

            $queue = $this->groupSelectionService->ensureQueue($mahasiswa, $periodeId, true);

            if (! $existing) {
                $existing = $this->registrations->create([
                    'mahasiswa_id' => $mahasiswa->id,
                    'period_id' => $periodeId,
                    'kelompok_id' => null,
                    'notes' => $notes,
                    'status' => 'pending',
                    'registration_date' => now(),
                ]);
            } elseif (in_array($existing->status, ['rejected', 'completed'], true)) {
                throw ValidationException::withMessages([
                    'period_id' => 'Status pendaftaran Anda pada periode ini tidak mengizinkan perubahan kelompok.',
                ]);
            } else {
                $existing->notes = $notes;
                $existing->save();
            }

            if (! $kelompokId) {
                $queue->status = $existing->kelompok_id ? 'dalam_kelompok' : 'menunggu';
                $queue->save();

                return $existing->fresh(['kelompok.lokasi', 'kelompok.dpl', 'periode']);
            }

            $kelompok = KelompokKkn::query()
                ->where('period_id', $periode->id)
                ->where('status', 'active')
                ->findOrFail($kelompokId);

            $updated = $this->groupSelectionService->assignGroup($existing, $mahasiswa, $kelompok->id);
            $updated->notes = $notes;
            $updated->save();

            return $updated->fresh(['kelompok.lokasi', 'kelompok.dpl', 'periode']);
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
                ->where('period_id', $periodeId)
                ->lockForUpdate()
                ->first();

            if (! $registration) {
                throw ValidationException::withMessages([
                    'period_id' => 'Pendaftaran periode ini tidak ditemukan.',
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
        $connection = DB::connection('kkn');

        if ($connection->transactionLevel() > 0 || $connection->getPdo()->inTransaction()) {
            return $callback();
        }

        return $connection->transaction($callback);
    }

    private function withRegistrationLocks(Mahasiswa $mahasiswa, int $periodeId, ?int $kelompokId, callable $callback): mixed
    {
        $ttl = max(3, (int) \App\Models\KKN\SystemSetting::get('registration_lock_ttl_seconds', 8));
        $wait = max(1, (int) \App\Models\KKN\SystemSetting::get('registration_lock_wait_seconds', 6));
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
}
