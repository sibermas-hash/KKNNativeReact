<?php

namespace App\Http\Controllers;

use App\Services\ProposalService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProposalController extends Controller
{
    protected $proposalService;

    public function __construct(ProposalService $proposalService)
    {
        $this->proposalService = $proposalService;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $groupId = $user->getActiveGroupId();

        if (!$groupId && !$user->hasRole('admin') && !$user->hasRole('dpl')) {
             return redirect()->route('dashboard')->with('error', 'Belum memiliki kelompok.');
        }

        if ($user->hasRole('admin') || $user->hasRole('dpl')) {
            $proposals = \App\Models\Proposal::with(['group', 'user'])->latest()->paginate(10);
            return Inertia::render('Admin/Proposals/Index', [
                'proposals' => $proposals
            ]);
        }

        $proposal = $this->proposalService->getGroupProposal($groupId);

        return Inertia::render('Student/Proposals/Index', [
            'proposal' => $proposal
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'program_title' => 'required|string|max:255',
            'program_department' => 'required|string',
            'team_member_count' => 'required|integer',
            'team_members' => 'required|array',
            'budget' => 'nullable|numeric',
            'objectives' => 'nullable|string',
        ]);

        $user = $request->user();
        $groupId = $user->getActiveGroupId();

        if (!$groupId) {
             return back()->with('error', 'Kelompok tidak ditemukan.');
        }

        $this->proposalService->submitProposal($user->id, $groupId, $validated);

        return back()->with('success', 'Proposal berhasil diajukan.');
    }

    public function review(Request $request, int $id)
    {
        $proposal = \App\Models\Proposal::findOrFail($id);
        $this->authorize('review', $proposal);

        $validated = $request->validate([
            'status' => 'required|in:approved,rejected,revision_required',
            'feedback' => 'nullable|string',
        ]);

        $this->proposalService->reviewProposal($id, $request->user()->id, $validated['status'], $validated['feedback']);

        return back()->with('success', 'Proposal telah direview.');
    }
}
