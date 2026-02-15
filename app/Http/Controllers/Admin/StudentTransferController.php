<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\PeriodContextService;
use App\Services\StudentTransferService;
use App\Models\KKN\Periode;
use App\Models\KKN\KelompokKkn;
use Illuminate\Http\Request;

class StudentTransferController extends Controller
{
    public function __construct(
        private StudentTransferService $transferService,
        private PeriodContextService $contextService,
    ) {}

    /**
     * Execute a student transfer.
     */
    public function transfer(Request $request)
    {
        $validated = $request->validate([
            'peserta_kkn_id' => 'required|exists:peserta_kkn,id',
            'target_period_id' => 'required|exists:periode,id',
            'target_group_id' => 'nullable|exists:kelompok_kkn,id',
            'reason' => 'required|string|max:500',
        ]);

        try {
            $history = $this->transferService->transferStudent(
                $validated['peserta_kkn_id'],
                $validated['target_period_id'],
                $validated['target_group_id'] ?? null,
                $validated['reason'],
                auth()->id(),
            );

            return back()->with('success', 'Peserta berhasil dipindahkan.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Get available transfer targets (periods and groups).
     */
    public function getTransferTargets(Request $request)
    {
        $currentPeriodId = $request->input('current_period_id');

        $periods = Periode::where('id', '!=', $currentPeriodId)
            ->orderBy('angkatan', 'desc')
            ->orderBy('jenis')
            ->get(['id', 'angkatan', 'jenis', 'name', 'kuota']);

        $groups = [];
        if ($request->has('target_period_id')) {
            $groups = KelompokKkn::where('period_id', $request->input('target_period_id'))
                ->withCount('peserta')
                ->get(['id', 'nama_kelompok', 'code', 'capacity'])
                ->map(function ($g) {
                    return [
                        'id' => $g->id,
                        'nama' => $g->nama_kelompok ?? $g->code,
                        'capacity' => $g->capacity,
                        'current_count' => $g->peserta_count,
                        'available' => $g->capacity ? $g->capacity - $g->peserta_count : null,
                    ];
                });
        }

        return response()->json(['periods' => $periods, 'groups' => $groups]);
    }
}
