<?php

declare(strict_types=1);

namespace App\Services\KKN;

use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\KelompokKkn;
use Illuminate\Support\Facades\DB;

class PlacementService
{
    /**
     * Simple automatic placement example.
     * - Finds approved, unplaced participants and assigns them into KelompokKkn respecting kuota.
     * - This is a sample; adapt to real business rules and concurrency controls.
     */
    public static function placeParticipantsAutomatically(Periode $periode): void
    {
        // Wrap in transaction to avoid partial assignments
        DB::transaction(function () use ($periode) {
            // Example: participants with status 'approved' and no kelompok_id
            $participants = PesertaKkn::query()
                ->where('periode_id', $periode->id)
                ->where('status', 'approved')
                ->whereNull('kelompok_id')
                ->orderBy('approved_at')
                ->lockForUpdate()
                ->get();

            if ($participants->isEmpty()) {
                return;
            }

            // Fetch existing groups with available capacity
            $groups = KelompokKkn::query()
                ->where('periode_id', $periode->id)
                ->get()
                ->keyBy('id');

            // Helper to find group with free slot
            $findGroupWithSlot = function () use (&$groups) {
                foreach ($groups as $group) {
                    $capacity = $group->kuota ?? 0;
                    $count = $group->peserta()->count();
                    if ($capacity === 0 || $count < $capacity) {
                        return $group;
                    }
                }
                return null;
            };

            foreach ($participants as $participant) {
                $group = $findGroupWithSlot();
                if (! $group) {
                    // Create new group (basic naming). Adjust as needed.
                    $group = KelompokKkn::create([
                        'periode_id' => $periode->id,
                        'nama_kelompok' => 'Kelompok ' . (KelompokKkn::where('periode_id', $periode->id)->count() + 1),
                        'kuota' => $periode->kuota ? intval($periode->kuota) : 10,
                    ]);
                    $groups->put($group->id, $group);
                }

                // Assign participant
                $participant->kelompok_id = $group->id;
                $participant->status = 'placed';
                $participant->save();
            }
        });
    }
}
