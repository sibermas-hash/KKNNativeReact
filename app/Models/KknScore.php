<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KknScore extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'group_id',
        'execution_score',
        'article_score',
        'discipline_score',
        'attitude_score',
        'dpl_weighted_score',
        'village_weighted_score',
        'total_score',
        'letter_grade',
        'dpl_graded_by',
        'village_graded_by',
        'dpl_graded_at',
        'village_graded_at',
    ];

    protected $casts = [
        'dpl_graded_at' => 'datetime',
        'village_graded_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }
}
