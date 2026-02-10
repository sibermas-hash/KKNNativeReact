<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Proposal;

class ProposalPolicy extends BasePolicy
{
    public function viewAny(User $user): bool
    {
        return $this->superAdminBypass($user, 'viewAny') ?? true;
    }

    public function view(User $user, Proposal $proposal): bool
    {
        if ($bypass = $this->superAdminBypass($user, 'view')) return true;
        
        if ($user->hasRole('student')) {
            // Check if student belongs to the proposal's group via active registration
            return $user->student?->registrations()
                ->where('group_id', $proposal->group_id)
                ->exists();
        }
        
        if ($user->hasRole('dpl')) {
            return $proposal->reviewer_id === $user->lecturer?->id;
        }
        
        return true;
    }

    public function create(User $user): bool
    {
        // Only approved students who have joined a group can create proposals
        if ($user->hasRole('student')) {
            return $user->student?->registrations()
                ->where('status', 'approved')
                ->whereNotNull('group_id')
                ->exists();
        }
        
        return false;
    }

    public function update(User $user, Proposal $proposal): bool
    {
        if ($bypass = $this->superAdminBypass($user, 'update')) return true;
        
        if ($user->hasRole('student')) {
            // Must be member of the group
            $isMember = $user->student?->registrations()
                ->where('group_id', $proposal->group_id)
                ->exists();
                
            // Can only edit draft or rejected proposals
            $canEdit = in_array($proposal->status, ['draft', 'rejected']);
            
            return $isMember && $canEdit;
        }
        
        if ($user->hasRole('dpl')) {
            return $proposal->reviewer_id === $user->lecturer?->id;
        }
        
        return $user->hasRole('admin');
    }

    public function review(User $user, Proposal $proposal): bool
    {
        if ($bypass = $this->superAdminBypass($user, 'review')) return true;
        
        return ($user->hasRole('dpl') && $proposal->reviewer_id === $user->lecturer?->id) ||
               $user->hasAnyRole(['admin', 'superadmin']);
    }
}
