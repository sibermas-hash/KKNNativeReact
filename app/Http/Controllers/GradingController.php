<?php

namespace App\Http\Controllers;

use App\Services\GradingService;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\KelompokKkn;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GradingController extends Controller
{
    protected $gradingService;

    public function __construct(GradingService $gradingService)
    {
        $this->gradingService = $gradingService;
    }

    /**
     * Display grading interface for DPL
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', NilaiKkn::class);
        
        $user = $request->user();
        $groupId = $request->input('group_id');
        
        $groups = [];
        if ($user->hasRole('superadmin')) {
             $groups = KelompokKkn::orderBy('code')->get();
             if (!$groupId && $groups->isNotEmpty()) {
                 $groupId = $groups->first()->id;
             }
        } else {
             $dosen = $user->dosen;
             $groupId = $groupId ?: ($dosen?->kelompokKkn()->first()?->id ?? null);
             $groups = $dosen?->kelompokKkn ?? [];
        }
        
        if (!$groupId) {
            return Inertia::render('Admin/Grading/Index', [
                'summary' => null,
                'groups' => $groups,
                'selectedGroupId' => null,
                'error' => 'Belum ada kelompok yang ditugaskan.'
            ]);
        }

        $summary = $this->gradingService->getGroupGradingSummary($groupId);

        return Inertia::render('Admin/Grading/Index', [
            'summary' => $summary,
            'groups' => $groups,
            'selectedGroupId' => $groupId,
        ]);
    }

    /**
     * Submit DPL scores (Komponen A)
     */
    public function submitDPLScores(\App\Http\Requests\Admin\DplGradingRequest $request)
    {
        $validated = $request->validated();

        $score = NilaiKkn::firstOrNew([
            'user_id' => $validated['student_id'],
            'kelompok_id' => $validated['group_id'],
        ]);

        $this->authorize('update', $score);

        $this->gradingService->submitDPLScores(
            $validated['student_id'],
            $validated['group_id'],
            $validated['final_report_score'],
            $validated['execution_score'],
            $validated['article_score'],
            $request->user()->id
        );

        return back()->with('success', 'Nilai DPL berhasil disimpan.');
    }

    /**
     * Submit Village Head scores (Komponen B)
     */
    public function submitVillageScores(\App\Http\Requests\Admin\VillageGradingRequest $request)
    {
        $validated = $request->validated();

        $score = NilaiKkn::firstOrNew([
            'user_id' => $validated['student_id'],
            'kelompok_id' => $validated['group_id'],
        ]);

        $this->authorize('update', $score);

        $this->gradingService->submitVillageHeadScores(
            $validated['student_id'],
            $validated['group_id'],
            $validated['discipline_score'],
            $validated['attitude_score'],
            $request->user()->id
        );

        return back()->with('success', 'Nilai Mitra Desa berhasil disimpan.');
    }

    /**
     * Submit Admin scores (Komponen C)
     */
    public function submitAdminScores(\App\Http\Requests\Admin\AdminGradingRequest $request)
    {
        $validated = $request->validated();

        $score = NilaiKkn::firstOrNew([
            'user_id' => $validated['student_id'],
            'kelompok_id' => $validated['group_id'],
        ]);

        $this->authorize('update', $score);

        $this->gradingService->submitAdminScores(
            $validated['student_id'],
            $validated['group_id'],
            $validated['workshop_score'],
            $validated['administration_score'],
            $request->user()->id
        );

        return back()->with('success', 'Nilai LPPM/Admin berhasil disimpan.');
    }
}
