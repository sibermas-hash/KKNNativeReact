<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\Dosen;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\KelompokKkn;
use App\Services\PeriodContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DplAssignmentController extends Controller
{
    public function __construct(
        private PeriodContextService $contextService,
    ) {}

    /**
     * Assign a DPL to a period with max group capacity.
     */
    public function assignToPeriod(Request $request)
    {
        $validated = $request->validate([
            'dosen_id' => 'required|exists:dosen,id',
            'period_id' => 'required|exists:periode,id',
            'max_groups' => 'integer|min:1|max:20',
        ]);

        $dplPeriod = DplPeriod::updateOrCreate(
            [
                'dosen_id' => $validated['dosen_id'],
                'period_id' => $validated['period_id'],
            ],
            [
                'max_groups' => $validated['max_groups'] ?? 5,
                'is_active' => true,
            ]
        );

        return back()->with('success', 'DPL berhasil ditugaskan ke periode.');
    }

    /**
     * Assign a DPL-Period entry to a group.
     */
    public function assignToGroup(Request $request, KelompokKkn $group)
    {
        $validated = $request->validate([
            'dpl_period_id' => 'required|exists:dpl_periods,id',
        ]);

        $dplPeriod = DplPeriod::findOrFail($validated['dpl_period_id']);

        // Validate capacity
        if (!$dplPeriod->hasCapacity()) {
            return back()->with('error', 'DPL sudah mencapai batas maksimum kelompok untuk periode ini.');
        }

        // Validate same period
        if ($group->period_id !== $dplPeriod->period_id) {
            return back()->with('error', 'Kelompok dan DPL harus berada di periode yang sama.');
        }

        DB::connection('kkn')->transaction(function () use ($group, $dplPeriod) {
            $group->update([
                'dpl_id' => $dplPeriod->dosen_id,       // backward compat
                'dpl_period_id' => $dplPeriod->id,
            ]);
        });

        return back()->with('success', 'DPL berhasil ditugaskan ke kelompok.');
    }

    /**
     * Get available DPLs for the active period with remaining capacity.
     */
    public function getAvailableDpl()
    {
        $periodId = $this->contextService->getActivePeriodId();

        if (!$periodId) {
            return response()->json([]);
        }

        $dplList = Dosen::availableForPeriod($periodId)
            ->with(['dplPeriods' => function ($q) use ($periodId) {
                $q->where('period_id', $periodId);
            }])
            ->get()
            ->map(function ($dosen) use ($periodId) {
                $dplPeriod = $dosen->dplPeriods->first();
                return [
                    'id' => $dosen->id,
                    'nama' => $dosen->nama,
                    'nip' => $dosen->nip,
                    'dpl_period_id' => $dplPeriod?->id,
                    'max_groups' => $dplPeriod?->max_groups,
                    'current_groups' => $dplPeriod?->kelompok()->count() ?? 0,
                    'remaining_slots' => $dplPeriod?->getRemainingSlots() ?? 0,
                ];
            });

        return response()->json($dplList);
    }

    /**
     * Remove DPL assignment from a period.
     */
    public function removeDplFromPeriod(DplPeriod $dplPeriod)
    {
        // Check if DPL has assigned groups
        if ($dplPeriod->kelompok()->count() > 0) {
            return back()->with('error', 'Tidak dapat menghapus DPL yang masih memiliki kelompok aktif.');
        }

        $dplPeriod->update(['is_active' => false]);

        return back()->with('success', 'DPL berhasil dihapus dari periode.');
    }
}
