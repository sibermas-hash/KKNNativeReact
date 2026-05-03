<?php

declare(strict_types=1);

namespace App\Services\KKN;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use Illuminate\Support\Facades\DB;

class PlacementService
{
    /**
     * Automatic placement for regular KKN.
     * Finds approved, unplaced participants and assigns them into KelompokKkn respecting kuota.
     * Skips self_determined periods (those are handled by placeParticipantSelfDetermined).
     */
    public static function placeParticipantsAutomatically(Periode $periode): void
    {
        // Skip if this is a self-determined placement period
        $periode->loadMissing('jenisKkn');
        if ($periode->placement_mode === Periode::PLACEMENT_MODE_SELF_DETERMINED
            || $periode->jenisKkn?->placement_mode === 'self_determined') {
            return;
        }

        DB::transaction(function () use ($periode) {
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

            $groups = KelompokKkn::query()
                ->where('periode_id', $periode->id)
                ->get()
                ->keyBy('id');

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
                    $group = KelompokKkn::create([
                        'periode_id' => $periode->id,
                        'nama_kelompok' => 'Kelompok '.(KelompokKkn::where('periode_id', $periode->id)->count() + 1),
                        'kuota' => $periode->kuota ? intval($periode->kuota) : 10,
                    ]);
                    $groups->put($group->id, $group);
                }

                $participant->kelompok_id = $group->id;
                $participant->status = 'placed';
                $participant->save();
            }
        });
    }

    /**
     * Self-determined placement for KKN Mandiri.
     * Creates a solo-group (capacity=1) for a single participant, using their
     * registered domisili as the reference location.
     */
    public static function placeParticipantSelfDetermined(PesertaKkn $peserta): KelompokKkn
    {
        return DB::transaction(function () use ($peserta) {
            $peserta->loadMissing(['mahasiswa', 'periode']);

            $mahasiswa = $peserta->mahasiswa;
            $periode = $peserta->periode;

            // Create a solo group with capacity 1
            $groupNumber = KelompokKkn::where('periode_id', $periode->id)->count() + 1;

            $group = KelompokKkn::create([
                'periode_id' => $periode->id,
                'nama_kelompok' => 'Mandiri-'.($mahasiswa->nim ?? $groupNumber),
                'kuota' => 1,
            ]);

            // Assign participant
            $peserta->kelompok_id = $group->id;
            $peserta->status = 'placed';
            $peserta->save();

            return $group;
        });
    }
}
