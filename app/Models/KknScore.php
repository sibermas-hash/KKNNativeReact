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
        // Komponen A (DPL)
        'final_report_score',
        'execution_score',
        'article_score',
        // Komponen B (Mitra/Village)
        'discipline_score',
        'attitude_score',
        // Komponen C (Admin/LPPM)
        'workshop_score',
        'administration_score',
        // Weighted scores
        'dpl_weighted_score',
        'village_weighted_score',
        // Output
        'total_score',
        'letter_grade',
        'is_finalized',
        // Graded by
        'dpl_graded_by',
        'village_graded_by',
        'admin_graded_by',
        // Timestamps
        'dpl_graded_at',
        'village_graded_at',
        'admin_graded_at',
    ];

    protected $casts = [
        'final_report_score' => 'decimal:2',
        'execution_score' => 'decimal:2',
        'article_score' => 'decimal:2',
        'discipline_score' => 'decimal:2',
        'attitude_score' => 'decimal:2',
        'workshop_score' => 'decimal:2',
        'administration_score' => 'decimal:2',
        'dpl_weighted_score' => 'decimal:2',
        'village_weighted_score' => 'decimal:2',
        'total_score' => 'decimal:2',
        'is_finalized' => 'boolean',
        'dpl_graded_at' => 'datetime',
        'village_graded_at' => 'datetime',
        'admin_graded_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function dplGradedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dpl_graded_by');
    }

    public function villageGradedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'village_graded_by');
    }

    public function adminGradedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_graded_by');
    }
}
