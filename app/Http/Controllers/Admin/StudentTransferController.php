<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\PeriodContextService;
use App\Services\StudentTransferService;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\KelompokKkn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class StudentTransferController extends Controller
{
    public function __construct(
        private StudentTransferService $transferService,
        private PeriodContextService $contextService,
    ) {}

    /**
     * Display the student transfer page.
     */
    public function index()
    {
        Gate::authorize('transfer-students');
        $periodId = $this->contextService->getActivePeriodId();

        $students = $periodId
            ? PesertaKkn::with(['mahasiswa', 'kelompok', 'periode'])
                ->where('period_id', $periodId)
                ->whereNotIn('status', ['rejected'])
                ->orderBy('created_at', 'desc')
                ->get()
            : collect([]);

        $targetPeriods = Periode::where('id', '!=', $periodId)
            ->orderByDesc('periode')
            ->orderBy('jenis')
            ->get(['id', 'name', 'periode', 'jenis', 'kuota']);

        return Inertia::render('Admin/Peserta/Transfer', [
            'students' => $students,
            'targetPeriods' => $targetPeriods,
            'title' => 'Transfer Peserta',
        ]);
    }
    public function transfer(Request $request)
    {
        Gate::authorize('transfer-students');

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
            \Illuminate\Support\Facades\Log::error('Student transfer failed', ['error' => $e->getMessage()]);
            return back()->with('error', 'Transfer peserta gagal. Silakan coba lagi.');
        }
    }

    /**
     * Get available transfer targets (periods and groups).
     */
    public function getTransferTargets(Request $request)
    {
        $currentPeriodId = $request->input('current_period_id');

        $periods = Periode::where('id', '!=', $currentPeriodId)
            ->orderBy('periode', 'desc')
            ->orderBy('jenis')
            ->get(['id', 'periode', 'jenis', 'name', 'kuota']);

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
