<?php

namespace App\Models\KKN;

use App\Models\KKN\Periode;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

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

    protected $casts = [
        'interview_date' => 'date',
    ];

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function participants(): HasMany
    {
        return $this->hasMany(InterviewParticipant::class);
    }

    public function pesertaKkn(): BelongsToMany
    {
        return $this->belongsToMany(PesertaKkn::class, 'interview_participants', 'interview_schedule_id', 'peserta_kkn_id')
            ->withPivot(['result', 'notes', 'processed_by', 'processed_at'])
            ->withTimestamps();
    }
}
