<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkProgram extends Model
{
    use HasFactory;

    protected $fillable = [
        'group_id',
        'title',
        'description',
        'sdg_goals',
        'objectives',
        'target_participants',
        'budget',
        'status',
        'submitted_at',
        'approved_at',
        'approved_by',
        'approval_notes',
    ];

    protected $casts = [
        'sdg_goals' => 'array',
        'target_participants' => 'integer',
        'budget' => 'decimal:2',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function proposals(): HasMany
    {
        return $this->hasMany(WorkProgramProposal::class);
    }
}
