<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InterviewSchedule extends Model
{
    protected $fillable = [
        'periode_id',
        'interview_date',
        'interview_time_start',
        'interview_time_end',
        'location',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'interview_date' => 'date',
            'interview_time_start' => 'datetime:H:i',
            'interview_time_end' => 'datetime:H:i',
        ];
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function participants(): HasMany
    {
        return $this->hasMany(InterviewParticipant::class);
    }

    public function getParticipantCountAttribute(): int
    {
        return $this->participants()->count();
    }

    public function getPendingCountAttribute(): int
    {
        return $this->participants()->where('result', 'pending')->count();
    }

    public function getPassedCountAttribute(): int
    {
        return $this->participants()->where('result', 'passed')->count();
    }

    public function getFailedCountAttribute(): int
    {
        return $this->participants()->where('result', 'failed')->count();
    }
}
