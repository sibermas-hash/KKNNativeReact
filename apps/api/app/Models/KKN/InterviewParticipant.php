<?php

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InterviewParticipant extends Model
{
    protected $fillable = [
        'interview_schedule_id',
        'peserta_kkn_id',
        'result',
        'notes',
        'processed_by',
        'processed_at',
    ];

    protected $casts = [
        'processed_at' => 'datetime',
    ];

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(InterviewSchedule::class, 'interview_schedule_id');
    }

    public function pesertaKkn(): BelongsTo
    {
        return $this->belongsTo(PesertaKkn::class);
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
