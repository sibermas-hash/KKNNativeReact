<?php

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class Proposal extends Model
{
    use SoftDeletes;

    protected $connection = 'kkn';
    protected $table = 'proposal';

    protected $fillable = [
        'user_id',
        'kelompok_id',
        'title',
        'program_title',
        'program_department',
        'team_member_count',
        'team_members',
        'budget',
        'objectives',
        'status',
        'feedback',
        'reviewed_by',
        'submitted_at',
        'reviewed_at',
    ];

    protected $casts = [
        'team_members' => 'array',
        'budget' => 'decimal:2',
        'team_member_count' => 'integer',
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokKkn::class, 'kelompok_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
