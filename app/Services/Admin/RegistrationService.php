<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Models\KKN\PesertaKkn;
use Illuminate\Support\Facades\DB;

class RegistrationService
{
    /**
     * Bulk approve registrations and sync with master data if needed.
     */
    public function bulkApprove(array $ids, int $adminId): int
    {
        return DB::transaction(function () use ($ids, $adminId) {
            $count = 0;
            PesertaKkn::whereIn('id', $ids)
                ->where('status', 'pending')
                ->each(function ($registration) use (&$count, $adminId) {
                    $registration->update([
                        'status' => 'approved',
                        'processed_by' => $adminId,
                        'processed_at' => now(),
                    ]);
                    $count++;
                });
            return $count;
        });
    }

    /**
     * Bulk reject registrations.
     */
    public function bulkReject(array $ids, string $reason, int $adminId): int
    {
        return DB::transaction(function () use ($ids, $reason, $adminId) {
            return PesertaKkn::whereIn('id', $ids)
                ->where('status', 'pending')
                ->update([
                    'status' => 'rejected',
                    'rejection_reason' => $reason,
                    'processed_by' => $adminId,
                    'processed_at' => now(),
                ]);
        });
    }
}
