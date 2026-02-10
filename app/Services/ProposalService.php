<?php

namespace App\Services;

use App\Models\Proposal;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProposalService
{
    /**
     * Create or update proposal
     */
    public function submitProposal(
        int $userId,
        int $groupId,
        array $data
    ): Proposal {
        return DB::transaction(function () use ($userId, $groupId, $data) {
            $proposal = Proposal::updateOrCreate(
                [
                    'group_id' => $groupId,
                ],
                [
                    'user_id' => $userId, // Representative (Coordinator)
                    'title' => $data['title'],
                    'program_title' => $data['program_title'],
                    'program_department' => $data['program_department'],
                    'team_member_count' => $data['team_member_count'],
                    'team_members' => $data['team_members'], // JSON array
                    'budget' => $data['budget'] ?? null,
                    'objectives' => $data['objectives'] ?? null,
                    'status' => 'submitted',
                    'submitted_at' => now(),
                ]
            );

            return $proposal;
        });
    }

    /**
     * Review proposal (Admin/DPL)
     */
    public function reviewProposal(
        int $proposalId,
        int $reviewerId,
        string $status,
        ?string $feedback = null
    ): Proposal {
        $proposal = Proposal::findOrFail($proposalId);

        $proposal->update([
            'status' => $status,
            'feedback' => $feedback,
            'reviewed_by' => $reviewerId,
            'reviewed_at' => now(),
        ]);

        return $proposal->fresh();
    }

    /**
     * Get proposal for a group
     */
    public function getGroupProposal(int $groupId): ?Proposal
    {
        return Proposal::where('group_id', $groupId)->first();
    }
}
