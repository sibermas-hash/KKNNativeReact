<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\AntrianKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\SlotTerkunci;
use App\Models\KKN\SystemSetting;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class GroupSelectionService
{
    private const ACTIVE_REGISTRATION_STATUSES = ['pending', 'document_submitted', 'approved'];

    private const REQUIRED_MALE_GENDER = 'L';

    private const DEFAULT_MALE_MIN_PERCENT = 20.0;

    private const DEFAULT_MALE_TARGET_PERCENT = 30.0;

    public static function activeRegistrationStatuses(): array
    {
        return self::ACTIVE_REGISTRATION_STATUSES;
    }

    public function assignGroup(PesertaKkn $registration, Mahasiswa $mahasiswa, int $kelompokId): PesertaKkn
    {
        $registration = PesertaKkn::query()
            ->with('periode')
            ->lockForUpdate()
            ->findOrFail($registration->id);

        $queue = $this->ensureQueue($mahasiswa, $registration->period_id, true);
        $period = $registration->periode()->lockForUpdate()->firstOrFail();
        $groupIdsToLock = collect([$registration->kelompok_id, $kelompokId])
            ->filter()
            ->unique()
            ->sort()
            ->values();

        $lockedGroups = KelompokKkn::query()
            ->where('period_id', $registration->period_id)
            ->whereIn('id', $groupIdsToLock)
            ->orderBy('id')
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        $targetGroup = $lockedGroups->get($kelompokId);

        if (! $targetGroup) {
            throw ValidationException::withMessages([
                'kelompok_id' => 'Kelompok tujuan tidak ditemukan.',
            ]);
        }

        if ($registration->kelompok_id === $targetGroup->id) {
            $queue->status = 'dalam_kelompok';
            $queue->save();

            return $registration;
        }

        $previousGroupId = $registration->kelompok_id;

        if ($registration->kelompok_id) {
            $this->assertCanLeaveCurrentGroup($registration, $period);

            if ($queue->pindah_count >= $this->maxGroupMoves()) {
                throw ValidationException::withMessages([
                    'kelompok_id' => 'Batas maksimal pindah kelompok telah tercapai.',
                ]);
            }
        }

        // FIX C2: Validate capacity with row-level locking on peserta_kkn
        // The kelompok row is already locked above, so this check is safe from race conditions
        $this->assertGroupCanAcceptStudent($targetGroup, $mahasiswa);

        $now = now();

        $registration->fill([
            'kelompok_id' => $targetGroup->id,
            'joined_group_at' => $now,
            'group_locked_until' => $now->copy()->addHours($this->coolingPeriodHours()),
        ])->save();

        if ($previousGroupId) {
            $queue->pindah_count += 1;
            $queue->penalti_poin += $this->groupLeavePenaltyPoints();
        }

        $queue->status = 'dalam_kelompok';
        $queue->save();

        return $registration->fresh(['kelompok.lokasi', 'kelompok.dpl', 'periode']);
    }

    public function validateGroupAcceptance(KelompokKkn $group, Mahasiswa $mahasiswa, ?int $excludingRegistrationId = null): void
    {
        $this->assertGroupCanAcceptStudent($group, $mahasiswa, $excludingRegistrationId);
    }

    public function leaveGroup(PesertaKkn $registration, Mahasiswa $mahasiswa): PesertaKkn
    {
        $registration = PesertaKkn::query()
            ->with('periode')
            ->lockForUpdate()
            ->findOrFail($registration->id);

        if (! $registration->kelompok_id) {
            throw ValidationException::withMessages([
                'kelompok_id' => 'Anda belum tergabung dalam kelompok mana pun.',
            ]);
        }

        $period = $registration->periode()->lockForUpdate()->firstOrFail();
        
        // Pindahkan pengecekan ke sini agar dilakukan saat row Periode terkunci (Atomicity)
        $this->assertCanLeaveCurrentGroup($registration, $period);

        KelompokKkn::query()
            ->whereKey($registration->kelompok_id)
            ->lockForUpdate()
            ->first();

        $queue = $this->ensureQueue($mahasiswa, $registration->period_id, true);

        $registration->fill([
            'kelompok_id' => null,
            'joined_group_at' => null,
            'group_locked_until' => null,
        ])->save();

        $queue->status = 'menunggu';
        $queue->pindah_count += 1;
        $queue->penalti_poin += $this->groupLeavePenaltyPoints();
        $queue->last_left_group_at = now();
        $queue->save();

        return $registration->fresh(['periode']);
    }

    public function ensureQueue(Mahasiswa $mahasiswa, int $periodeId, bool $lock = false): AntrianKkn
    {
        $query = AntrianKkn::query()
            ->where('mahasiswa_id', $mahasiswa->id)
            ->where('period_id', $periodeId);

        if ($lock) {
            $query->lockForUpdate();
        }

        $queue = $query->first();

        if ($queue) {
            return $queue;
        }

        return AntrianKkn::create([
            'mahasiswa_id' => $mahasiswa->id,
            'period_id' => $periodeId,
            'status' => 'menunggu',
            'joined_at' => now(),
        ]);
    }

    public function coolingPeriodHours(): int
    {
        return max(0, (int) SystemSetting::get('cooling_period_hours', 24));
    }

    public function maxGroupMoves(): int
    {
        return max(0, (int) SystemSetting::get('max_group_moves', 2));
    }

    public function groupLeavePenaltyPoints(): int
    {
        return max(0, (int) SystemSetting::get('group_leave_penalty_points', 10));
    }

    public function groupLockDaysBeforeStart(): int
    {
        return max(0, (int) SystemSetting::get('group_lock_days_before_start', 7));
    }

    /**
     * @return array{minimum:int, maximum:int}
     */
    public function maleQuotaRange(int $capacity): array
    {
        if ($capacity <= 0) {
            return [
                'minimum' => 0,
                'maximum' => 0,
            ];
        }

        $minimum = max(1, (int) ceil($capacity * $this->maleMinimumRatio()));
        $maximum = (int) floor($capacity * $this->maleTargetRatio());

        if ($maximum < $minimum) {
            $maximum = $minimum;
        }

        return [
            'minimum' => $minimum,
            'maximum' => $maximum,
        ];
    }

    public function maleMinimumPercent(): float
    {
        return $this->normalizePercentSetting(
            SystemSetting::get('group_male_min_ratio', (string) self::DEFAULT_MALE_MIN_PERCENT),
            self::DEFAULT_MALE_MIN_PERCENT
        );
    }

    public function maleTargetPercent(): float
    {
        $target = $this->normalizePercentSetting(
            SystemSetting::get('group_male_target_ratio', (string) self::DEFAULT_MALE_TARGET_PERCENT),
            self::DEFAULT_MALE_TARGET_PERCENT
        );

        return max($target, $this->maleMinimumPercent());
    }

    private function maleMinimumRatio(): float
    {
        return $this->maleMinimumPercent() / 100;
    }

    private function maleTargetRatio(): float
    {
        return $this->maleTargetPercent() / 100;
    }

    private function assertCanLeaveCurrentGroup(PesertaKkn $registration, Periode $period): void
    {
        if ($registration->group_locked_until && now()->lt($registration->group_locked_until)) {
            $remainingHours = (int) ceil(now()->diffInMinutes($registration->group_locked_until) / 60);

            throw ValidationException::withMessages([
                'kelompok_id' => "Anda belum bisa keluar dari kelompok. Cooling period tersisa {$remainingHours} jam.",
            ]);
        }

        $lockDate = $period->start_date?->copy()->subDays($this->groupLockDaysBeforeStart());
        if ($lockDate && now()->greaterThanOrEqualTo($lockDate->startOfDay())) {
            throw ValidationException::withMessages([
                'kelompok_id' => 'Tidak bisa keluar kelompok karena sudah memasuki masa kunci H-7 sebelum pelaksanaan.',
            ]);
        }
    }

    /**
     * Assert that a group can accept a student.
     *
     * IMPORTANT: The KelompokKkn row MUST be locked with lockForUpdate() BEFORE calling this method.
     * This ensures no race conditions occur when checking and updating capacity.
     *
     * FIX C2: This method uses lockForUpdate() on peserta_kkn rows to prevent concurrent modifications.
     * Since the KelompokKkn row is already locked by the caller, this creates a proper critical section.
     */
    private function assertGroupCanAcceptStudent(KelompokKkn $group, Mahasiswa $mahasiswa, ?int $excludingRegistrationId = null): void
    {
        $group->loadMissing([
            'slotTerkunci.fakultas',
            'slotTerkunci.prodi',
        ]);

        // FIX C2: Use lockForUpdate() to prevent race conditions on capacity check
        // This is safe because the KelompokKkn row is already locked by the caller
        $activeParticipants = PesertaKkn::query()
            ->where('kelompok_id', $group->id)
            ->whereIn('status', self::ACTIVE_REGISTRATION_STATUSES)
            ->when($excludingRegistrationId, fn ($query, $id) => $query->where('id', '!=', $id))
            ->with([
                'mahasiswa:id,faculty_id,program_id,gender',
            ])
            ->lockForUpdate()
            ->get([
                'id',
                'mahasiswa_id',
                'kelompok_id',
                'status',
            ]);

        if ($activeParticipants->count() >= $group->capacity) {
            throw ValidationException::withMessages([
                'kelompok_id' => "Kelompok {$group->nama_kelompok} sudah penuh.",
            ]);
        }

        $rules = $this->buildRuleSnapshot($group->slotTerkunci, $activeParticipants, $mahasiswa, (int) $group->capacity);
        if ($rules->isEmpty()) {
            return;
        }

        $matchingRules = $rules->filter(fn (array $rule) => $rule['matches_student']);
        $reservedRemainingForOthers = $rules
            ->filter(fn (array $rule) => ! $rule['matches_student'])
            ->sum('remaining');

        $openSeats = max($group->capacity - $activeParticipants->count() - $reservedRemainingForOthers, 0);
        if ($openSeats > 0) {
            return;
        }

        $blockingRules = $rules
            ->filter(fn (array $rule) => ! $rule['matches_student'] && $rule['remaining'] > 0)
            ->values();

        if (
            $blockingRules->count() === 1
            && $blockingRules->first()['type'] === 'gender_male_minimum'
        ) {
            $remainingMaleSlots = $blockingRules->first()['remaining'];

            throw ValidationException::withMessages([
                'kelompok_id' => "Kelompok ini masih harus menyisakan {$remainingMaleSlots} slot untuk mahasiswa laki-laki agar target minimum {$this->maleMinimumPercent()}% terpenuhi.",
            ]);
        }

        if ($matchingRules->isNotEmpty()) {
            $firstRule = $matchingRules->first();

            throw ValidationException::withMessages([
                'kelompok_id' => "{$firstRule['label']} sudah penuh di kelompok {$group->nama_kelompok}.",
            ]);
        }

        throw ValidationException::withMessages([
            'kelompok_id' => 'Sisa slot kelompok ini sedang dicadangkan untuk komposisi fakultas atau prodi yang masih dibutuhkan.',
        ]);
    }

    /**
     * @param  Collection<int, SlotTerkunci>  $rules
     * @param  Collection<int, PesertaKkn>  $participants
     * @return Collection<int, array{type:string, label:string, matches_student:bool, remaining:int}>
     */
    private function buildRuleSnapshot(Collection $rules, Collection $participants, Mahasiswa $mahasiswa, int $capacity): Collection
    {
        $slotRules = $rules->map(function (SlotTerkunci $rule) use ($participants, $mahasiswa) {
            $usedCount = $participants->filter(function (PesertaKkn $participant) use ($rule) {
                return $participant->mahasiswa && $this->matchesRule($rule, $participant->mahasiswa);
            })->count();

            return [
                'type' => $rule->tipe_slot,
                'label' => $this->slotLabel($rule),
                'matches_student' => $this->matchesRule($rule, $mahasiswa),
                'remaining' => max($rule->kuota_slot - $usedCount, 0),
            ];
        });

        return $slotRules
            ->concat($this->buildRequiredMaleRuleSnapshot($participants, $mahasiswa, $capacity))
            ->values();
    }

    /**
     * @param  Collection<int, PesertaKkn>  $participants
     * @return Collection<int, array{type:string, label:string, matches_student:bool, remaining:int}>
     */
    private function buildRequiredMaleRuleSnapshot(Collection $participants, Mahasiswa $mahasiswa, int $capacity): Collection
    {
        $maleCount = $this->countMaleParticipants($participants);
        $maleQuota = $this->maleQuotaRange($capacity);
        $remainingMaleSlots = max($maleQuota['minimum'] - $maleCount, 0);

        if ($remainingMaleSlots === 0) {
            return collect();
        }

        return collect([[
            'type' => 'gender_male_minimum',
            'label' => "Target minimum laki-laki {$maleQuota['minimum']} orang",
            'matches_student' => $mahasiswa->gender === self::REQUIRED_MALE_GENDER,
            'remaining' => $remainingMaleSlots,
        ]]);
    }

    /**
     * @param  Collection<int, PesertaKkn>  $participants
     */
    private function countMaleParticipants(Collection $participants): int
    {
        return $participants->filter(function (PesertaKkn $participant) {
            return $participant->mahasiswa?->gender === self::REQUIRED_MALE_GENDER;
        })->count();
    }

    private function normalizePercentSetting(mixed $value, float $default): float
    {
        if (! is_numeric($value)) {
            return $default;
        }

        return min(100.0, max(0.0, (float) $value));
    }

    private function matchesRule(SlotTerkunci $rule, Mahasiswa $mahasiswa): bool
    {
        return match ($rule->tipe_slot) {
            'fakultas' => $rule->fakultas_id !== null && (int) $rule->fakultas_id === (int) $mahasiswa->faculty_id,
            'prodi' => $rule->prodi_id !== null && (int) $rule->prodi_id === (int) $mahasiswa->program_id,
            default => false,
        };
    }

    private function slotLabel(SlotTerkunci $rule): string
    {
        return match ($rule->tipe_slot) {
            'fakultas' => 'Slot Fakultas '.($rule->fakultas?->nama ?? 'terkunci'),
            'prodi' => 'Slot Prodi '.($rule->prodi?->nama ?? 'terkunci'),
            default => 'Slot terkunci',
        };
    }
}
