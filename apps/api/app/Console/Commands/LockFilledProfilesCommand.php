<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\KKN\Mahasiswa;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Lock profile fields for mahasiswa who have already filled their data,
 * so SIAKAD sync will NOT overwrite them.
 *
 * ALWAYS-OPEN fields (never locked, always updated from SIAKAD):
 *   mahasiswa: sks_completed, gpa, status_bta_ppi, is_paid_ukt, master_id, master_synced_at, semester
 *   users: (none — name/email/address locked if filled)
 *
 * Everything else gets locked if the mahasiswa has filled profile data
 * (proxy: phone is not null, meaning they visited the profile page).
 */
class LockFilledProfilesCommand extends Command
{
    protected $signature = 'sync:lock-filled-profiles
                            {--dry-run : Show what would be locked without writing}
                            {--force : Skip confirmation}';

    protected $description = 'Lock profile fields for mahasiswa who already filled data, protecting from SIAKAD overwrite. Academic fields (SKS, IPK, BTA/PPI, UKT) remain open.';

    // Fields on `mahasiswa` table that should be locked if they have data
    private const MHS_LOCKABLE_FIELDS = [
        'nama',
        'nik',
        'mother_name',
        'fakultas_id',
        'prodi_id',
        'batch_year',
        'gender',
        'birth_place',
        'birth_date',
        'shirt_size',
        'alamat',
        'phone',
        'marital_status',
    ];

    // Fields on `users` table that should be locked if they have data
    private const USER_LOCKABLE_FIELDS = [
        'name',
        'email',
        'address',
        'phone',
    ];

    // These are NEVER locked — always updated from SIAKAD
    // (listed here for documentation, not used in logic)
    private const ALWAYS_OPEN = [
        'sks_completed',
        'gpa',
        'status_bta_ppi',
        'is_paid_ukt',
        'master_id',
        'master_synced_at',
        'semester',
    ];

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $this->info('=== Lock Filled Profiles ===');
        $this->info('Academic fields ALWAYS open: ' . implode(', ', self::ALWAYS_OPEN));
        $this->info('Lockable mahasiswa fields: ' . implode(', ', self::MHS_LOCKABLE_FIELDS));
        $this->info('Lockable user fields: ' . implode(', ', self::USER_LOCKABLE_FIELDS));
        $this->newLine();

        if ($dryRun) {
            $this->warn('[DRY RUN] No data will be modified.');
        }

        // Find mahasiswa who have filled profile data
        // Proxy: phone is not null and not empty (they visited profile page)
        $query = Mahasiswa::query()
            ->whereNotNull('phone')
            ->where('phone', '!=', '')
            ->with('user');

        $total = $query->count();
        $this->info("Found {$total} mahasiswa with filled profiles.");

        if ($total === 0) {
            $this->info('Nothing to do.');
            return 0;
        }

        if (!$dryRun && !$this->option('force')) {
            if (!$this->confirm("Lock fields for {$total} mahasiswa? Academic fields (SKS, IPK, BTA/PPI, UKT) will remain open.")) {
                $this->info('Cancelled.');
                return 0;
            }
        }

        $mhsLocked = 0;
        $mhsSkipped = 0;
        $userLocked = 0;
        $userSkipped = 0;

        $query->chunk(500, function ($mahasiswas) use ($dryRun, &$mhsLocked, &$mhsSkipped, &$userLocked, &$userSkipped) {
            foreach ($mahasiswas as $mhs) {
                // === Lock mahasiswa fields ===
                $currentLocks = (array) ($mhs->manually_edited_fields ?? []);
                $newLocks = [];

                foreach (self::MHS_LOCKABLE_FIELDS as $field) {
                    // Only lock if:
                    // 1. Field has data (not null, not empty)
                    // 2. Field is not already locked
                    if (!in_array($field, $currentLocks, true)) {
                        $value = $mhs->{$field};
                        if ($value !== null && $value !== '') {
                            $newLocks[] = $field;
                        }
                    }
                }

                if (!empty($newLocks)) {
                    if (!$dryRun) {
                        $merged = array_values(array_unique(array_merge($currentLocks, $newLocks)));
                        $mhs->manually_edited_fields = $merged;
                        $mhs->saveQuietly(); // saveQuietly to avoid triggering events
                    }
                    $mhsLocked++;
                } else {
                    $mhsSkipped++;
                }

                // === Lock user fields ===
                $user = $mhs->user;
                if (!$user) {
                    continue;
                }

                $currentUserLocks = (array) ($user->manually_edited_fields ?? []);
                $newUserLocks = [];

                foreach (self::USER_LOCKABLE_FIELDS as $field) {
                    if (!in_array($field, $currentUserLocks, true)) {
                        $value = $user->{$field};
                        if ($value !== null && $value !== '') {
                            $newUserLocks[] = $field;
                        }
                    }
                }

                if (!empty($newUserLocks)) {
                    if (!$dryRun) {
                        $merged = array_values(array_unique(array_merge($currentUserLocks, $newUserLocks)));
                        $user->manually_edited_fields = $merged;
                        $user->saveQuietly();
                    }
                    $userLocked++;
                } else {
                    $userSkipped++;
                }
            }
        });

        $this->newLine();
        $this->table(
            ['Target', 'Locked', 'Skipped (already locked)'],
            [
                ['Mahasiswa', $mhsLocked, $mhsSkipped],
                ['Users', $userLocked, $userSkipped],
            ]
        );

        if ($dryRun) {
            $this->warn('[DRY RUN] No changes written. Remove --dry-run to apply.');
        } else {
            $this->info('Done. Profile fields locked. SIAKAD sync will only update: ' . implode(', ', self::ALWAYS_OPEN));
            Log::info('sync:lock-filled-profiles completed', [
                'mhs_locked' => $mhsLocked,
                'user_locked' => $userLocked,
            ]);
        }

        return 0;
    }
}
