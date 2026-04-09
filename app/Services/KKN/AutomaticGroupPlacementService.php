<?php

namespace App\Services\KKN;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaKkn;
use App\Enums\KknType;
use Illuminate\Support\Facades\DB;

class AutomaticGroupPlacementService
{
    /**
     * Automatic placement logic based on institutional rules from Pedoman Angkatan 56.
     */
    public function place(int $pesertaKknId): bool
    {
        return DB::transaction(function () use ($pesertaKknId) {
            $peserta = PesertaKkn::with(['mahasiswa.user', 'periode'])->findOrFail($pesertaKknId);
            $mahasiswa = $peserta->mahasiswa;
            $user = $mahasiswa->user;
            $periode = $peserta->periode;

            // Resolve KknType
            $kknType = $periode->jenis instanceof KknType ? $periode->jenis : KknType::tryFrom($periode->jenis) ?? KknType::REGULER;

            // Rule: Certain types do NOT use auto-placement (Administrative selection)
            if ($kknType->placementMode() === 'manual_admin' || $kknType->placementMode() === 'host_defined') {
                return false; 
            }

            // 1. Get student's domicile regency
            $domicileRegency = strtolower(trim((string)$user->domicile_regency_name));

            // 2. Build Query for eligible groups
            $query = KelompokKkn::query()
                ->where('period_id', $peserta->period_id)
                ->where('status', 'active')
                ->withCount('peserta');

            // 3. APPLY SPECIFIC SCHEME RULES (Bab II & V Panduan)
            if ($kknType === KknType::REGULER) {
                // REGULER Rule: MUST be a different Regency than domicile
                if (!empty($domicileRegency)) {
                    $query->whereHas('lokasi', function ($q) use ($domicileRegency) {
                        $q->whereRaw('LOWER(regency_name) != ?', [$domicileRegency]);
                    });
                }
            }
            
            // For TEMATIK/KAMPUNG_ZAKAT/DESA_KATANA: 
            // We usually target specific locations, so we don't block by domicile.
            // Placement is based on the program's defined location.

            // 4. Find the best candidate group
            $targetGroup = $query->get()
                ->filter(fn($group) => $group->peserta_count < ($group->capacity ?: 15))
                ->sortBy('peserta_count')
                ->first();

            if (!$targetGroup) {
                return false; 
            }

            // 5. Assign and update status
            $peserta->update([
                'kelompok_id' => $targetGroup->id,
                'status' => 'approved',
                'approved_at' => now(),
            ]);

            return true;
        });
    }
}
