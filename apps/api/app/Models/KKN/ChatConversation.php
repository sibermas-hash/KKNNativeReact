<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * ChatConversation — percakapan antara user (mahasiswa/dosen) dan admin.
 *
 * Status:
 *   - open    : dibuat user, belum dibalas admin
 *   - replied : admin sudah membalas minimal sekali
 *   - closed  : admin menutup tiket
 *
 * Audit R12-D2-014 fix: use SoftDeletes karena konsultasi adalah
 * audit-sensitive data.
 */
class ChatConversation extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'user_id', 'subject', 'status', 'priority',
        'last_message_at', 'closed_at', 'closed_by',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class, 'conversation_id');
    }

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function isOpen(): bool
    {
        return $this->status !== 'closed';
    }
}
