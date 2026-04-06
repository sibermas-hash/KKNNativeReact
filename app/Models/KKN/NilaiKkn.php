<?php

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class NilaiKkn extends Model
{
    use HasFactory;

    protected $connection = 'kkn';
    protected $table = 'nilai_kkn';

    // FIXED: Remove confusing mahasiswa_id - only use user_id
    protected $fillable = [
        'user_id',
        'kelompok_id',
        'final_report_score',
        'execution_score',
        'article_score',
        'discipline_score',
        'attitude_score',
        'workshop_score',
        'administration_score',
        'dpl_weighted_score',
        'village_weighted_score',
        'lppm_weighted_score',
        'total_score',
        'letter_grade',
        'dpl_graded_by',
        'dpl_graded_at',
        'village_graded_by',
        'village_graded_at',
        'admin_graded_by',
        'admin_graded_at',
        'evidence_file',
        'verification_token',
        'is_finalized',
    ];

    protected $casts = [
        'dpl_graded_at' => 'datetime',
        'village_graded_at' => 'datetime',
        'admin_graded_at' => 'datetime',
        'is_finalized' => 'boolean',
        'final_report_score' => 'decimal:2',
        'execution_score' => 'decimal:2',
        'article_score' => 'decimal:2',
        'discipline_score' => 'decimal:2',
        'attitude_score' => 'decimal:2',
        'workshop_score' => 'decimal:2',
        'administration_score' => 'decimal:2',
        'dpl_weighted_score' => 'decimal:2',
        'village_weighted_score' => 'decimal:2',
        'lppm_weighted_score' => 'decimal:2',
        'total_score' => 'decimal:2',
    ];

    /**
     * FIXED: Proper relationship - nilai_kkn.user_id → users.id
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }

    public function mahasiswa(): HasOne
    {
        return $this->hasOne(Mahasiswa::class, 'user_id', 'user_id');
    }

    /**
     * Get mahasiswa_id for compatibility
     */
    public function getMahasiswaIdAttribute(): ?int
    {
        return $this->user?->mahasiswa?->id;
    }

    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokKkn::class, 'kelompok_id');
    }

    public function dplGradedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'dpl_graded_by');
    }

    public function adminGradedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'admin_graded_by');
    }
}
