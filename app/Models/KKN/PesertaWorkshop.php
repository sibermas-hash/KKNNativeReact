<?php

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class PesertaWorkshop extends Model
{
    use HasFactory;

    protected $table = 'peserta_workshop';

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
        return $this->belongsTo(Workshop::class, 'workshop_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
