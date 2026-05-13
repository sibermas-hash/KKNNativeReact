<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfileChangeRequest extends Model
{
    protected $fillable = [
        'user_id',
        'requested_changes',
        'status',
        'reviewed_by',
        'rejection_reason',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'requested_changes' => 'array',
            'reviewed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        // withTrashed: audit trail — reviewer bisa saja sudah di-soft-delete,
        // tapi history siapa yang review harus tetap terlihat.
        return $this->belongsTo(User::class, 'reviewed_by')->withTrashed();
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }
}
