<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkshopParticipant extends Model
{
    use HasFactory;

    protected $fillable = [
        'workshop_id',
        'user_id',
        'registered_at',
        'attendance_status',
        'checked_in_at',
        'certificate_generated',
        'certificate_path',
        'certificate_issued_at',
    ];

    protected $casts = [
        'registered_at' => 'datetime',
        'checked_in_at' => 'datetime',
        'certificate_generated' => 'boolean',
        'certificate_issued_at' => 'datetime',
    ];

    public function workshop(): BelongsTo
    {
        return $this->belongsTo(Workshop::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
