<?php

namespace App\Models\KKN;

use App\Enums\AbcdStage;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\User;

class ProgramKerja extends Model
{
    use HasFactory;

    protected $connection = 'kkn';
    protected $table = 'program_kerja';

    protected $fillable = [
        'kelompok_id',
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
        'abcd_stage',
    ];

    protected $casts = [
        'sdg_goals' => 'array',
        'target_participants' => 'integer',
        'budget' => 'decimal:2',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'abcd_stage' => AbcdStage::class,
    ];

    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokKkn::class, 'kelompok_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
